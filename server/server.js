'use strict';
var network = require('../util/network'),
    express = require('express'),
    app = express(),
    config = require('../configs/config'),
    serverConfig = config.getServerConfig(),
    debug = require('debug')('server');

config.loadFromArgs();

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


function getExpress() {
    return app;
}

var running;


function run() {
    if(running) {
        throw new Error('Server is already running');
    }
    running = true;
    // Create and launch server
    var http = require("http").createServer(app);
    http.listen(app.get("port"), app.get("ipaddr"), function () {
        console.log('Server launched. Go to ', "http://" + app.get("serveraddress") + ":" + app.get("port"));
    });
}

function mountModules(modules) {
    debug('Mounting modules', modules);

    if(!(modules instanceof Array)) {
        modules = [modules];
    }

    for (var i = 0; i < modules.length; i++) {
        var route, router;
        if (typeof modules[i] === 'string') {
            router = require('../routes/' + modules[i]);
            route = '/' + modules[i];
        } else {
            router = require(modules[i].routeFile);
            route = modules[i].route;
        }
        app.use(route, router);
    }
}

exports = module.exports = {
    getExpress: getExpress,
    run: run,
    mountModules: mountModules
};