"use strict";

var debug = require('debug')('main'),
    fs = require('fs-extra'),
    network = require('./util/network'),
    deviceManager = require('./devices/manager'),
    express = require('express'),
    app = express(),
    config = require('./configs/config'),
    serverConfig = config.getServerConfig();

process.chdir(__dirname);

deviceManager.restart().catch(function(err) {
    console.error('An error occured while restarting the device manager', err);
});
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
var modules = [
    'navview',
    'visu',
    'config',
    'devices',
    {routeFile: './routes/database', route: '/database'},
    {routeFile: './routes/visu-redirect', route: '/'}
];

debug('Mounting modules', modules);
for (var i = 0; i < modules.length; i++) {
    var route, router;
    if (typeof modules[i] === 'string') {
        router = require('./routes/' + modules[i]);
        route = '/' + modules[i];
    } else {
        router = require(modules[i].routeFile);
        route = modules[i].route;
    }
    app.use(route, router);
}

// Create and launch server
var http = require("http").createServer(app);
http.listen(app.get("port"), app.get("ipaddr"), function () {
    console.log('Server launched. Go to ', "http://" + app.get("serveraddress") + ":" + app.get("port"));
});
