'use strict';

var argv = require('minimist')(process.argv.slice(2));
var config = require('../configs/config');
var appconfig = config.getAppconfig();


exports = module.exports = function (name, def) {
    var opt = (argv[name]) ? argv[name] : null;
    return opt || appconfig[name] || def;
};