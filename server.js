var debug = require('debug')('main'),
    argv = require('minimist')(process.argv.slice(2)),
    network = require('./util/network'),
    RequestManager = require('./lib/RequestManager'),
    cache = require('./scheduler/cache'),
    express = require('express'),
    middleware = require('./middleware/common'),
    appconfig = require('./appconfig.json'),
    _ = require('lodash'),
    app = express();




// Load configuration file
var configName = (argv.config && (typeof argv.config === 'string')) ? argv.config : 'default';

debug('config name:', configName);
var config = require('./configs/config').getConfig(configName);
var devices = config.devices;

var requestManager = new RequestManager(config);

// Wait for serial to be ready and then start
//requestManager.serial.then(start).catch(handleError);

requestManager.init().then(start).catch(handleError);
//Promise.resolve().then(function() {
//    requestManager.init();
//}).then(start).catch(handleError);


function start() {
    require('./scheduler/epoch').init(config, requestManager);
    cache.init(config, requestManager, {
        delay: 1000
    });
}

function handleError(error) {
    console.log('error handled', error);
}
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
    debug('Server launched. ', "http://" + app.get("ipaddr") + ":" + app.get("port"));
});


var view = '/visualizer/index.html?viewURL=/views/' + (argv.view || 'dispatcher') + '.json';
console.log('view: ', view);
app.get('/', function(req, res) {
    res.redirect(301, view);
});

app.get('/status', function(req, res) {
    return res.json(cache.data.status);
});

app.get('/status/:device',
    middleware.validateParameters([{name: 'device', type: 'device'}]),
    function(req, res) {
        // get parameter from cache
        var device = res.locals.parameters.device;
        return res.json(cache.data.status[device]);
    });

app.get('/param/:device',
    middleware.validateParameters([{name: 'device', type: 'device'}]),
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
        console.log(cache.data.param[device]);
        return res.json(cache.data.param[device][param]);
    }
);

app.get('/save',
    middleware.validateParameters([{name: 'device', type: 'device'}, {name: 'param'}, {name: 'value'}]),
    function(req, res) {
        var cmd = res.locals.parameters.device + res.locals.parameters.param + res.locals.parameters.value;
        requestManager.addRequest(cmd).then(function() {
            return res.json({ok: true});
        });
    });


app.get('/all', function(req, res) {
    var all = {
        config: devices,
        param: cache.data.param,
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
        });
    });

app.post('/command',
    middleware.validateParameters([{name: 'command'}]),
    function(req, res) {
        var cmd = res.locals.parameters.command;
        console.log(cmd);
        requestManager.addRequest(cmd).then(function(result) {
            return res.send(result);
        });
    });