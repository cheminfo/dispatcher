var debug = require('debug')('main'),
    argv = require('minimist')(process.argv.slice(2)),
    network = require('./util/network'),
    SerialQueueManager = require('./lib/SerialQueueManager'),
    EpochManager = require('./scheduler/epoch'),
    CacheDatabase = require('./db/CacheDatabase'),
    Filter = require('./lib/filter'),
    Cache = require('./scheduler/cache'),
    database = require('./db/database'),
    Config = require('./configs/config'),
    express = require('express'),
    middleware = require('./middleware/common'),
    appconfig = require('./appconfig.json'),
    _ = require('lodash'),
    app = express();




// Load configuration file
// Command line in prioritary over appconfig file
var configName = getOption('config', 'default');
debug('config name', configName);
configName = configName.split(',');

debug('config names:', configName);

var config = new Config();
var caches = [];
for(var i=0; i<configName.length; i++) {
    config.addConfiguration(configName[i]);
}

// The configuration variable
var conf = config.config;

// A hash to easily retrieve serial managers from a device id
var requestManagers = {};

// First level of config describes the plugged devices,
// i.e. a device connected to the usb port
// We have one serial manager per plugged device
for(var i=0; i<conf.length; i++) {
    var requestManager = new SerialQueueManager(conf[i]);
    requestManager.init();
    var epochManager = new EpochManager(requestManager, conf[i]);
    epochManager.start();

// Cache and Cache database
    var cache = new Cache(requestManager, conf[i]);
    caches.push(cache);
    if(conf[i].sqlite) {
        var cacheDatabase = new CacheDatabase(cache, conf);
        cacheDatabase.start();
    }
    cache.start();

    for(var j=0; j<conf[i].devices.length; j++) {
        requestManagers[conf[i].devices[j].id] = requestManager;
    }
}
//var devices = config.devices;






// Middleware
var validateFilter = middleware.validateParameters( {type: 'filter', name: 'filter'});
var validateDevice = middleware.validateParameters({type: 'device', name: 'device'});

// The static directory is where all the statically served files go
// Like jpg, js, css etc...
app.use(express.static(__dirname + '/static'));
var bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));

app.use('/', function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    next();
});


var ipaddress = appconfig.ipaddress || '';
var ipValid = network.validateIp(ipaddress);
app.set("port", appconfig.port || 80);
app.set("ipaddr", ipValid ? appconfig.ipaddress : ''); // by default we listen to all the ips
app.set("serveraddress", ipValid ? appconfig.ipaddress : network.getMyIp() || '127.0.0.1');


var http = require("http").createServer(app);
http.listen(app.get("port"), app.get("ipaddr"), function() {
    console.log('Server launched. Go to ', "http://" + app.get("serveraddress") + ":" + app.get("port"));
});


var modules = ['navview'];
debug('Mounting modules', modules);

for(var i=0; i<modules.length; i++) {
    var router = require('./routes/'+modules[i]);
    app.use('/'+modules[i], router);
}



// The root element redirects to the default visualizer view
getOption('config');

var defaultView = getOption('view', 'dispatcher');
var view = '/visualizer/index.html?config=/configs/default.json&viewURL=/views/' + defaultView + '.json';
app.get('/', function(req, res) {
    res.redirect(301, view);
});

app.get('/status', function(req, res) {
    return res.json(cache.data.status);
});

app.get('/status/:device',
    validateDevice,
    function(req, res) {
        // get parameter from cache
        var device = res.locals.parameters.device;
        return res.json(cache.data.status[device]);
    });

app.get('/param/:device',
    validateDevice,
    function(req, res) {
        var device = res.locals.parameters.device;
        return res.json(cache.data.param[device]);
    }
);

app.get('/param/:device/:param',
    middleware.validateParameters([{name: 'device', type: 'device'}, {name: 'param'}]),
    function(req, res) {
        var device = res.locals.parameters.device;
        var param = res.locals.parameters.param;
        return res.json(cache.data.param[device][param]);
    }
);

app.get('/save',
    middleware.validateParameters([{name: 'device'}, {name: 'param'}, {name: 'value'}]),
    function(req, res) {
        var deviceId = res.locals.parameters.device;
        var reqManager = requestManagers[deviceId];
        var pluggedDevice = config.findPluggedDevice(deviceId);
        var prefix = pluggedDevice.findDeviceById(deviceId).prefix;
        var cmd = prefix + res.locals.parameters.param + res.locals.parameters.value;
        reqManager.addRequest(cmd).then(function() {
            return res.json({ok: true});
        }, function() {
            return res.status(500, {ok: false});
        });
    });

var filter = new Filter(config);
app.get('/all/:filter', validateFilter, function(req, res) {
    // visualizer filter converts object to an array
    // for easy display in a table
    //var entry = cache.get('entry');
    var entry = {}, status = {};
    for(var i=0; i<caches.length; i++) {
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
    function(req, res) {
        var idx = _.findIndex(characters, { 'id': res.locals.parameters.device });
        var prefix = devices[idx].prefix;
        requestManager.addRequest(prefix+res.locals.parameters.command).then(function(entries) {
            return res.json(entries);
        }, function() {
            return res.status(500);
        });
    });

app.post('/command',
    middleware.validateParameters([{name: 'command', required: true}, {name: 'device', required: true}]),
    function(req, res) {
        var deviceId = res.locals.parameters.device;
        var reqManager = requestManagers[deviceId];
        var pluggedDevice = config.findPluggedDevice(deviceId);
        var prefix = pluggedDevice.findDeviceById(deviceId).prefix;
        if(!deviceId) {
            return res.status(400);
        }

        var cmd = res.locals.parameters.command;
        reqManager.addRequest(prefix+cmd).then(function(result) {
            return res.send(result);
        }, function() {
            return res.status(500);
        });
    });

app.get('/database/all/:filter', validateFilter, function(req, res) {
    var all = {};
});

var queryValidator = middleware.validateParameters([
    {name: 'fields', required: false},
    {name: 'device', type: 'device', required: true},
    {name: 'limit', required: false},
    {name: 'mean', required: false}
]);


app.get('/database/:device', queryValidator, function(req, res) {
    var deviceId = cache.data.deviceIds[res.locals.parameters.device];
    var fields = res.locals.parameters.fields || '*';
    var mean = res.locals.parameters.mean || 'entry';
    var limit = res.locals.parameters.limit || 10;
    fields = fields.split(',');
    var options = {
        limit: limit,
        fields: fields,
        mean: mean
    };

    database.get(deviceId, options).then(function(result) {
        console.log(result);
        //var chart = filter.visualizerChart(res.locals.parameters.device, result);
        var chart = filter.chartFromDatabaseEntries(result);
        return res.status(200).json(chart);
    }).catch(function(err) {
        console.log(err);
        return res.status(400).json('Database error');
    });
});

function findDevice(id) {
    for(var i=0; i<config.length; i++) {
        var d;
        if(d = config[i].findDeviceById(id)) {
            return d;
        }
    }
    return null;
}

function getOption(name, def) {
    var opt = (argv[name] && (typeof argv[name] === 'string')) ? argv[name] : null;
    return opt || appconfig[name] || def;
}