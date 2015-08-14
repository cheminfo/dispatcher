"use strict";

var debug = require('debug')('main'),
    argv = require('minimist')(process.argv.slice(2)),
    fs = require('fs-extra'),
    network = require('./util/network'),
    Promise = require('bluebird'),
    SerialQueueManager = require('./lib/SerialQueueManager'),
    EpochManager = require('./scheduler/epoch'),
    CacheDatabase = require('./db/CacheDatabase'),
    Filter = require('./lib/filter'),
    Cache = require('./scheduler/cache'),
    database = require('./db/database'),
    config = require('./configs/config'),
    express = require('express'),
    middleware = require('./middleware/common'),
    _ = require('lodash'),
    app = express(),
    serverConfig = getServerConfig();


var filter, appconfig = getAppconfig();
var requestManagers = [], requestManagersHash = {};
var caches = [], cachesHash = {};
var epochs = [], epochsHash = {};
var cacheDatabases = [];
var defaultView;

process.chdir(__dirname);

restart();

// Middleware
var validateFilter = middleware.validateParameters({type: 'filter', name: 'filter'});
var validateDevice = middleware.validateParameters({type: 'device', name: 'device'});


// Static files
app.use(express.static(__dirname + '/static'));
app.use('/configs', express.static(__dirname + '/configs'));
app.use('/devices', express.static(__dirname + '/devices'));


var bodyParser = require('body-parser');
app.use(bodyParser.json({
    limit: serverConfig.bodyLimit
}));

app.use(bodyParser.urlencoded({
    extended: true,
    limit: serverConfig.bodyLimit
}));


var ipaddress = serverConfig.ipaddress || '';
var ipValid = network.validateIp(ipaddress);
app.set("port", serverConfig.port || 80);
app.set("ipaddr", ipValid ? serverConfig.ipaddress : ''); // by default we listen to all the ips
app.set("serveraddress", ipValid ? serverConfig.ipaddress : network.getMyIp() || '127.0.0.1');


// Initialize modules
var modules = ['navview', 'visu', 'config', 'database'];
debug('Mounting modules', modules);

for (var i = 0; i < modules.length; i++) {
    var router = require('./routes/' + modules[i]);
    app.use('/' + modules[i], router);
}

// Create and launch server
var http = require("http").createServer(app);
http.listen(app.get("port"), app.get("ipaddr"), function () {
    console.log('Server launched. Go to ', "http://" + app.get("serveraddress") + ":" + app.get("port"));
});


// The root element redirects to the default visualizer view

app.get('/', function (req, res) {
    res.set({
        'Cache-Control': 'no-cache'
    });
    var df = defaultView || 'dispatcher';
    var view;
    if (appconfig.useLactame) {
        view = '/visualizer_lactame/index.html?config=/config/default.json&viewURL=/views/' + df + '.json&dataURL=/data/default.json';
    }
    else {
        view = '/visualizer/index.html?config=/config/default.json&viewURL=/views/' + df + '.json&dataURL=/data/default.json';
    }

    res.redirect(301, view);
});

app.get('/restart', function (req, res) {
    restart().then(function () {
        return res.status(200).json({ok: true});
    }, function (err) {
        return res.status(500).json({ok: false, message: err});
    });
});

app.get('/status', function (req, res) {
    return res.json(cache.data.status);
});

app.get('/status/:device',
    validateDevice,
    function (req, res) {
        // get parameter from cache
        var device = res.locals.parameters.device;
        return res.json(cache.data.status[device]);
    });

app.get('/param/:device',
    validateDevice,
    function (req, res) {
        var device = res.locals.parameters.device;
        return res.json(cache.data.param[device]);
    }
);

app.get('/param/:device/:param',
    middleware.validateParameters([{name: 'device', type: 'device'}, {name: 'param'}]),
    function (req, res) {
        var device = res.locals.parameters.device;
        var param = res.locals.parameters.param;
        return res.json(cache.data.param[device][param]);
    }
);

app.get('/save',
    middleware.validateParameters([{name: 'device'}, {name: 'param'}, {name: 'value'}]),
    function (req, res) {
        var deviceId = res.locals.parameters.device;
        var reqManager = requestManagersHash[deviceId];
        var pluggedDevice = config.findPluggedDevice(deviceId);
        var prefix = pluggedDevice.findDeviceById(deviceId).prefix;
        var cmd = prefix + res.locals.parameters.param + res.locals.parameters.value;
        reqManager.addRequest(cmd).then(function () {
            return res.json({ok: true});
        }, function () {
            return res.status(500, {ok: false});
        });
    });


app.get('/all/:filter', validateFilter, function (req, res) {
    // visualizer filter converts object to an array
    // for easy display in a table
    //var entry = cache.get('entry');
    var entry = {}, status = {};
    for (var i = 0; i < caches.length; i++) {
        entry = _.merge(entry, filter[res.locals.parameters.filter](caches[i].get('entry')));
        status = _.merge(status, caches[i].get('status'));
    }
    var all = {
        config: config.getMergedDevices(),
        entry: entry,
        status: status
    };

    res.json(all);
});

app.get('/command/:device/:command',
    middleware.validateParameters([{name: 'device', type: 'device'}, {name: 'command'}]),
    function (req, res) {
        var idx = _.findIndex(characters, {'id': res.locals.parameters.device});
        var prefix = devices[idx].prefix;
        requestManager.addRequest(prefix + res.locals.parameters.command).then(function (entries) {
            return res.json(entries);
        }, function () {
            return res.status(500);
        });
    });

app.post('/command',
    middleware.validateParameters([{name: 'command', required: true}, {name: 'device', required: true}]),
    function (req, res) {
        var deviceId = res.locals.parameters.device;
        var reqManager = requestManagersHash[deviceId];
        var pluggedDevice = config.findPluggedDevice(deviceId);
        var prefix = pluggedDevice.findDeviceById(deviceId).prefix;
        if (!deviceId) {
            return res.status(400);
        }

        var cmd = res.locals.parameters.command;
        reqManager.addRequest(prefix + cmd).then(function (result) {
            return res.send(result);
        }, function () {
            return res.status(500);
        });
    });

function findDevice(id) {
    for (var i = 0; i < config.length; i++) {
        var d;
        if (d = config[i].findDeviceById(id)) {
            return d;
        }
    }
    return null;
}

function stopManagers() {
    var promises = [];
    for (var i = 0; i < requestManagers.length; i++) {
        promises.push(requestManagers[i].close());
    }
    return Promise.all(promises);
}

function stopSchedulers() {
    _.keys(caches).forEach(function (key) {
        caches[key].stop();
    });

    _.keys(epochs).forEach(function (key) {
        epochs[key].stop();
    });
}

function stopCacheDatabases() {
    for (var i = 0; i < cacheDatabases.length; i++) {
        cacheDatabases[i].stop();
    }
}

function restart() {
    process.chdir(__dirname);
    return new Promise(function (resolve, reject) {
        debug('restart');
        appconfig = JSON.parse(fs.readFileSync('appconfig.json'));
        defaultView = getOption('view', 'dispatcher');
        stopSchedulers();
        debug('schedulers stopped');
        stopManagers().then(function () {
            debug('managers stopped');
            stopCacheDatabases();
            // Reset some vars
            caches = [];
            cachesHash = {};
            epochs = [];
            epochsHash = {};
            requestManagers = [];
            requestManagersHash = {};
            cacheDatabases = [];


            // Load configuration file
            var configName = getOption('config', 'default');
            debug('config name', configName);
            configName = configName.trim().split(',');


            for (i = 0; i < configName.length; i++) {
                config.addConfiguration(configName[i]);
            }

            // The configuration variable
            var conf = config.config;
            filter = new Filter();

            // A hash to easily retrieve serial managers from a device id


            // First level of config describes the plugged devices,
            // i.e. a device connected to the usb port
            // We have one serial manager per plugged device
            debug('number of usb devices ' + conf.length);
            for (var i = 0; i < conf.length; i++) {
                var requestManager = new SerialQueueManager(conf[i]);
                requestManager.init();
                var epochManager = new EpochManager(requestManager, conf[i]);
                epochManager.start();

                // Cache and Cache database
                var cache = new Cache(requestManager, conf[i]);

                if (conf[i].sqlite) {
                    var cacheDatabase = new CacheDatabase(cache, conf);
                    cacheDatabases.push(cacheDatabase);
                    cacheDatabase.start();
                }
                cache.start();

                caches.push(cache);
                epochs.push(epochManager);
                requestManagers.push(requestManager);
                for (var j = 0; j < conf[i].devices.length; j++) {
                    requestManagersHash[conf[i].devices[j].id] = requestManager;
                    cachesHash[conf[i].devices[j].id] = cache;
                    epochsHash[conf[i].devices[j].id] = epochManager;
                }
            }
            resolve();
        }, function () {
            debug('Could not restart?');
            reject('Failed restart');
        });
    });
    function getOption(name, def) {
        var opt = (argv[name] && (typeof argv[name] === 'string')) ? argv[name] : null;
        return opt || appconfig[name] || def;
    }

}

function getServerConfig() {
    try {
        return require('./serverConfig.json');
    }
    catch (err) {
        fs.copySync('./defaultServerConfig.json', './serverConfig.json');
        return getServerConfig();
    }
}

function getAppconfig() {
    try {
        return require('./appconfig.json');
    } catch (err) {
        fs.copySync('./defaultAppconfig.json', './appconfig.json');
        return getAppconfig();
    }
}