var _ = require('lodash'),
    debug = require('debug')('config'),
    path = require('path'),
    fs = require('fs');

var isProcessed = false;
var configuration = {};
exports = module.exports = {
    load: function(name) {
        if(isProcessed) {
            return configuration;
        }
        // default.json contains default values for mandatory parameters
        var def = require('./default.json');
        configuration = require('./'+name+'.json');

        _.defaults(configuration, def);
        processConf(configuration);
        checkConfig(configuration);
    },

    get: function() {
        if(!isProcessed) {
            throw new Error('Unspecified configuration file. Use the load function');
        }
        // return a copy of the configuration to ensure it is read-only
        return _.cloneDeep(configuration);
    }
};

function checkConfig(conf) {
    if(!conf) {
        throw new Error('Config Error: config undefined');
    }
    // Check that the database directory exists
    if(conf.sqlite.dir) {
        if(!fs.existsSync(conf.sqlite.dir)) {
            throw new Error('Config Error: The sqlite directory ' + conf.sqlite.dir + ' does not exist');
        }
    }

    if(!conf.port) {
        throw new Error("You must specify a port");
    }
}

function processConf(conf) {
    debug('process conf file');
    //
    if(conf.sqlite && conf.sqlite.dir) {
        conf.sqlite.dir = path.join(__dirname, '..', conf.sqlite.dir);
    }

    // The configuration varibale will eventually contain both
    // the basic configuration and the devices configuration
    for(var i=0; i<conf.devices.length; i++) {
        _.merge(conf.devices[i], require('../devices/'+conf.devices[i].type+'.json'));
    }
    isProcessed = true;
}