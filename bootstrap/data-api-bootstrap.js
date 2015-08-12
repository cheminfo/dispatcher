'use strict';
var app = require('express')();
var config = require('../configs/config');
var bodyParser = require('body-parser');

app.use(bodyParser.json());

// Create configuration
config.addConfiguration('dbtest');

// Initialize modules
var modules = ['database'];

for(var i=0; i<modules.length; i++) {
    var router = require('../routes/'+modules[i]);
    app.use('/'+modules[i], router);
}

exports = module.exports = app;