'use strict';
var app = require('express')();
var Config = require('../../configs/config');

// Create configuration
var config = new Config();
config.addConfiguration('dbtest');

// Initialize modules
var modules = ['database'];

for(var i=0; i<modules.length; i++) {
    var router = require('../routes/'+modules[i]);
    app.use('/'+modules[i], router);
}

exports = module.exports = {
    app: app,
    config: config
};