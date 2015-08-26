'use strict';

var _ = require('lodash'),
    debug = require('debug')('config'),
    path = require('path'),
    fs = require('fs-extra');

var loadedConfigs = {};

function Config() {
    this.config = [];
}

Config.prototype.addConfiguration = function (name) {
    debug('add configuration ' + name);
    var def = fs.readJsonSync(path.join(__dirname, 'plugged/default.json'));
    var config;
    if (!name.endsWith('.json')) name = name + '.json';
    if (loadedConfigs[name]) {
        debug('skip configuration ' + name + ', already exists');
        return;
    }
    if (name) {
        config = fs.readJsonSync(path.join(__dirname, 'plugged', name));
        if (!(config instanceof Array)) {
            config = [config];
        }
    }
    else {
        config = [];
    }


    for (var i = 0; i < config.length; i++) {
        // the default.json file contains all the default
        // configuration parameters of the device
        _.defaults(config[i], def);
        processConf(config[i]);
        checkPluggedDevice(config[i]);
        addUtility(config[i]);
        this.config.push(config[i]);
    }
    loadedConfigs[name] = true;
};

Config.prototype.findDeviceById = function (id) {
    for (var i = 0; i < this.config.length; i++) {
        var devId;
        if (devId = this.config[i].findDeviceById(id)) {
            return devId;
        }
    }
    return null;
};

Config.prototype.getParamByName = function (deviceId, name) {
    var device = this.findDeviceById(deviceId);
    if (!device) return null;
    var param;
    for (var key in device.parameters) {
        if (device.parameters[key].name === name) {
            param = key;
        }
    }
    return param === undefined ? null : param;
};

Config.prototype.getMergedDevices = function () {
    return _(this.config).pluck('devices').flatten().value();

};

Config.prototype.findPluggedDevice = function (id) {
    for (var i = 0; i < this.config.length; i++) {
        if (this.config[i].findDeviceById(id)) {
            return this.config[i];
        }
    }
    return null;
};

Config.prototype.loadFromArgs = function () {
    debug('load from args');
    var cmdArgs = require('../util/cmdArgs');
    var configName = cmdArgs('config', 'default');
    debug('config name', configName);
    var configurations = configName.trim().split(',');


    for (var i = 0; i < configurations.length; i++) {
        this.addConfiguration(configurations[i]);
    }
};

Config.prototype.getAppconfig = function (stop) {
    try {
        return fs.readJsonSync(path.join(__dirname, '../general.config.json'));
    } catch (err) {
        if (stop) throw new Error('Could not get app config');
        fs.copySync(
            path.join(__dirname, '../default.general.config.json'),
            path.join(__dirname, '../general.config.json'));
        return this.getAppconfig(true);
    }
};

Config.prototype.getServerConfig = function (stop) {
    try {
        return fs.readJsonSync(path.join(__dirname, '../server.config.json'));
    }
    catch (err) {
        debug('Could not read server config file, copying default');
        if (stop) throw new Error('Could not get server config');
        fs.copySync(
            path.join(__dirname, '../default.server.config.json'),
            path.join(__dirname, '../server.config.json'));
        return this.getServerConfig(true);
    }
};


function checkPluggedDevice(conf) {
    if (!conf) {
        throw new Error('Config Error: config undefined');
    }
    // Check that the database directory exists
    if (conf.sqlite.dir) {
        if (!fs.existsSync(conf.sqlite.dir)) {
            // Create the directory
            debug('The sqlite directory does not exist. We will try creating it.');
            if (!fs.mkdirsSync(conf.sqlite.dir)) {
                throw new Error('Config Error: The sqlite directory ' + conf.sqlite.dir + ' does not exist and unable to create it');
            }
        }
    }

    //
    if (!conf.port) {
        throw new Error("You must specify a port");
    }

    if (conf.devices) {
        var ids = _.pluck(conf.devices, 'id');
        var uids = _.unique(ids);
        if (ids.length !== uids.length) {
            throw new Error('Config Error: device ids must be unique within a physical device');
        }
    }

    // If there is more than one device on one plugged device,
    // They should all have a defined and unique prefix
    if (conf.devices.length > 1) {
        var prefixes = _.pluck(conf.devices, 'prefix');
        var uprefixes = _(prefixes).unique().compact().value();
        if (prefixes.length !== uprefixes.length) {
            throw new Error('Config Error: on a given physical device, the prefix for each device must be unique');
        }
    }
}


function processConf(conf) {
    debug('process conf file');
    //
    if (conf.sqlite && conf.sqlite.dir) {
        conf.sqlite.dir = path.join(__dirname, '..', conf.sqlite.dir);
    }

    // The configuration varibale will eventually contain both
    // the basic configuration and the devices configuration
    // merged together. The device configuratin has precedence
    var idxToRemove = [];
    for (var i = 0; i < conf.devices.length; i++) {
        var deviceFile = path.join(__dirname, 'devices', conf.devices[i].type + '.json');
        try {
            var deviceConfig = fs.readJsonSync(deviceFile);
        } catch (e) {
            console.error('Could not load configuration type ' + conf.devices[i].type + ' from ' + deviceFile);
            idxToRemove.push(i);
            continue;
        }
        _.merge(conf.devices[i], deviceConfig);
    }

    // Reverse loop because we are splicing in the loop
    for (i = conf.devices.length - 1; i >= 0; i -= 1) {
        if (idxToRemove.indexOf(i) > -1) {
            conf.devices.splice(i, 1);
        }
    }

    // Don't let a prefix be undefined if it's the only one
    if (conf.devices.length === 1) {
        conf.devices[0].prefix = conf.devices[0].prefix || '';
    }
}

function addUtility(conf) {
    conf.findDeviceById = function (id) {
        var idx = _.findIndex(this.devices, function (device) {
            return device.id === id;
        });
        return idx > -1 ? this.devices[idx] : null;
    }
}
exports = module.exports = new Config();