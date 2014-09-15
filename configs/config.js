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
        if(checkConfig(configuration)) {
            // Ensure the returned value is read-only
            return _.cloneDeep(configuration);
        }
        else {
            throw new Error('Bad config file');
        }
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
    // Check that the database directory exists
    if(conf.sqlite.dir) {
        if(!fs.existsSync(conf.sqlite.dir)) {
            throw new Error('Config Error: The sqlite directory ' + conf.sqlite.dir + ' does not exist');
        }
    }

    return !!conf;
}

function processConf(conf) {
    debug('process conf file');
    //
    if(conf.sqlite && conf.sqlite.dir) {
        conf.sqlite.dir = path.join(__dirname, '..', conf.sqlite.dir);
    }
    console.log('the dir: ', conf.sqlite.dir);

    if(typeof conf.port === 'object' && conf.port.regexp) {
        var dir = conf.port.dir || '/dev';
        var l = fs.readdirSync(dir);
        var regexp = new RegExp(conf.port.regexp);

        for(var i=0; i< l.length; i++) {
            if(l[i].match(regexp)) {
                conf.port = path.join(dir, l[i]);
                break;
            }
        }
    }

    // The configuration varibale will eventually contain both
    // the basic configuration and the devices configuration
    for(var i=0; i<conf.devices.length; i++) {
        _.merge(conf.devices[i], require('../devices/'+conf.devices[i].type+'.json'));
    }
    isProcessed = true;
}