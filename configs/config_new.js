var _ = require('lodash'),
    debug = require('debug')('config'),
    path = require('path'),
    fs = require('fs');

var Config = exports = module.exports = function Config(name) {
    // load config
    // default.json contains default values for mandatory parameters
    this.config = [];
    this.addConfiguration(name);

};

Config.prototype.addConfiguration = function(name) {
    var def = require('./default.json');
    var config;
    if(name) {
        config = require('./'+name+'.json');

        if(!(config instanceof Array)) {
            config = [config];
        }
    }
    else {
        config = [];
    }



    for(var i=0; i<config.length; i++) {
        _.defaults(config[i], def);
        processConf(config[i]);
        checkPluggedDevice(config[i]);
        addUtility(config[i]);
        this.config.push(config[i]);
    }
};

Config.prototype.getPluggedDevices = function() {
    return this.config;
};

Config.prototype.findDeviceById = function(id) {
    for(var i=0; i<this.config.length; i++) {
        var devId;
        if(devId = this.config[i].findDeviceById(id)) {
            return devId;
        }
    }
    return null;
};

Config.prototype.getMergedDevices = function() {
    return _(this.config).pluck('devices').flatten().value();

};

Config.prototype.findPluggedDevice = function(id) {
    for(var i=0; i<this.config.length; i++) {
        if(this.config[i].findDeviceById(id)) {
            return this.config[i];
        }
    }
    return null;
}


function checkPluggedDevice(conf) {
    if(!conf) {
        throw new Error('Config Error: config undefined');
    }
    // Check that the database directory exists
    if(conf.sqlite.dir) {
        if(!fs.existsSync(conf.sqlite.dir)) {
            throw new Error('Config Error: The sqlite directory ' + conf.sqlite.dir + ' does not exist');
        }
    }

    //
    if(!conf.port) {
        throw new Error("You must specify a port");
    }

    if(conf.devices) {
        var ids = _.pluck(conf.devices, 'id');
        var uids = _.unique(ids);
        if(ids.length !== uids.length) {
            throw new Error('Config Error: device ids must be unique within a physical device');
        }
    }

    // If there is more than one device on one plugged device,
    // They should all have a defined and unique prefix
    if(conf.devices.length > 1) {
        var prefixes = _.pluck(conf.devices, 'prefix');
        var uprefixes = _(prefixes).unique().compact().value();
        if(prefixes.length !== uprefixes.length) {
            throw new Error('Config Error: on a given physical device, the prefix for each device must be unique');
        }
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

    // Don't let a prefix be undefined if it's the only one
    if(conf.devices.length === 1) {
        conf.devices[0].prefix = conf.devices[0].prefix || '';
    }
}

function addUtility(conf) {
    conf.findDeviceById = function(id) {
        var idx = _.findIndex(this.devices, function(device) {
            return device.id === id;
        });
        return idx > -1 ? this.devices[idx] : null;
    }
}