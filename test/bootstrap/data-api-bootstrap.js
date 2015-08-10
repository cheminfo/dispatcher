'use strict';
var app = require('express')();

// Initialize modules
var modules = ['navview'];

for(var i=0; i<modules.length; i++) {
    var router = require('../routes/'+modules[i]);
    app.use('/'+modules[i], router);
}

exports = module.exports = app;