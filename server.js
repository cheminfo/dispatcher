var debug = require('debug')('main'),
    argv = require('minimist')(process.argv.slice(2)),
    network = require('./util/network'),
    SerialQueueManager = require('./lib/SerialQueueManager'),
    EpochManager = require('./scheduler/epoch'),
    CacheDatabase = require('./db/CacheDatabase'),
    Filter = require('./lib/filter'),
    Cache = require('./scheduler/cache'),
    database = require('./db/database'),
    express = require('express'),
    middleware = require('./middleware/common'),
    appconfig = require('./appconfig.json'),
    _ = require('lodash'),
    app = express();




// Load configuration file
var configName = (argv.config && (typeof argv.config === 'string')) ? argv.config : 'default';
debug('config name:', configName);
var config = require('./configs/config').load(configName);
var devices = config.devices;



var requestManager = new SerialQueueManager(config);
requestManager.init();
var epochManager = new EpochManager(requestManager);
epochManager.start();

// Cache and Cache database
var cache = new Cache(requestManager);
if(config.sqlite) {
    var cacheDatabase = new CacheDatabase(cache);
    cacheDatabase.start();
}
cache.start();


// Middleware
var validateFilter = middleware.validateParameters( {type: 'filter', name: 'filter'});
var validateDevice = middleware.validateParameters({type: 'device', name: 'device'});

// The static directory is where all the statically served files go
// Like jpg, js, css etc...
app.use(express.static(__dirname + '/static'));

app.use('/', function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    next();
});

var ipaddress = appconfig.ipaddress || '';
var ipValid = network.validateIp(ipaddress);
app.set("port", appconfig.port || 80);
app.set("ipaddr", ipValid ? appconfig.ipaddress : network.getMyIp() || '127.0.0.1');

var http = require("http").createServer(app);
http.listen(app.get("port"), app.get("ipaddr"), function() {
    console.log('Server launched. Go to ', "http://" + app.get("ipaddr") + ":" + app.get("port"));
});


// The root element redirects to the default visualizer view
var view = '/visualizer/index.html?viewURL=/views/' + (argv.view || 'dispatcher') + '.json';
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
    middleware.validateParameters([{name: 'device', type: 'device'}, {name: 'param'}, {name: 'value'}]),
    function(req, res) {
        var cmd = res.locals.parameters.device + res.locals.parameters.param + res.locals.parameters.value;
        requestManager.addRequest(cmd).then(function() {
            return res.json({ok: true});
        }, function() {
            return res.status(500, {ok: false});
        });
    });

var filter = new Filter();
app.get('/all/:filter', validateFilter, function(req, res) {
    // visualizer filter converts object to an array
    // for easy display in a table
    var entry = cache.data.entry;
    var all = {
        config: devices,
        entry: filter[res.locals.parameters.filter](entry),
        status: cache.data.status
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
    middleware.validateParameters([{name: 'command'}]),
    function(req, res) {
        var cmd = res.locals.parameters.command;
        requestManager.addRequest(cmd).then(function(result) {
            return res.send(result);
        }, function() {
            return res.status(500);
        });
    });

app.get('/database/all/:filter', validateFilter, function(req, res) {
    var all = {};
});

app.get('/database/:device', [
    validateDevice
    ], function(req, res) {
    var deviceId = cache.data.deviceIds[res.locals.parameters.device];

    var options = {
        limit: 10
    };

    database.get(deviceId, options).then(function(result) {
        console.log('the result', result);
        return res.status(200).json(result);
    }).catch(function() {
        return res.status(400).json('Database error');
    });
});