"use strict";

var debug = require('debug')('central'),
    express = require('express'),
    server = require('./server'),
    cmdArgs = require('../util/cmdArgs'),
    path = require('path');

process.chdir(path.join(__dirname, '..'));

// Initialize device communication
if (!cmdArgs('noDevices', false)) {
    var deviceManager = require('../devices/manager');
    deviceManager.restart().catch(function (err) {
        console.error('An error occured while restarting the device manager', err);
    });
}

// Initialize modules
if (!cmdArgs('noInterface')) {
    var app = server.getExpress();

    // Static files
    // TODO: move this elsewhere
    app.use('/', express.static(path.join(__dirname, '../static')));
    app.use('/configs', express.static(path.join(__dirname, '../configs/plugged')));
    app.use('/devices', express.static(path.join(__dirname, '../configs/devices')));
    var modules = [
        'navview',
        'visu',
        'config',
        'database',
        'scores',
        {routeFile: '../routes/visu-redirect', route: '/'}
    ];
    if(!(cmdArgs('noDevices'))) {
        modules.push('devices');
    }
    server.mountModules(modules);
    server.run();
}

