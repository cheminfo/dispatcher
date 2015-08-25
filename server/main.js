"use strict";

var debug = require('debug')('central'),
    express = require('express'),
    server = require('./server'),
    cmdArgs = require('../util/cmdArgs'),
    path = require('path');

process.chdir(path.join(__dirname, '..'));

if(cmdArgs('no-devices', false)) {
    var deviceManager = require('../devices/manager');
    deviceManager.restart().catch(function(err) {
        console.error('An error occured while restarting the device manager', err);
    });
}


var app = server.getExpress();

// Static files
// TODO: move this elsewhere
app.use('/static', express.static(path.join(__dirname, '../static')));
app.use('/configs', express.static(path.join(__dirname, '../configs/plugged')));
app.use('/devices', express.static(path.join(__dirname, '../configs/devices')));

// Initialize modules
var modules = [
    'navview',
    'visu',
    'config',
    'database',
    {routeFile: '../routes/visu-redirect', route: '/'}
];

server.mountModules(modules);
server.run();