// This class will listen to a given cache instance
// And write new entries to the database
// The cache instance should implement EventEmitter

var debug = require('debug')('CacheDatabase'),
    db = require('./database'),
    _ = require('lodash');

var CacheDatabase = exports = module.exports = function CacheDatabase(cache, config) {
    this.cache = cache;
    this.config = config;
    //require('../configs/config').get();

};

CacheDatabase.prototype.start = function() {
    this.cache.on('newdata', onNewData);
};

CacheDatabase.prototype.stop = function() {
    this.cache.removeListener('newdata', onNewData);
};

function onNewData(id, data) {
    debug('CacheDatabased received new data from cache');
    // Keep only the parameters that are explicitly defined in the
    // configuration of the devices

    // Make a copy so that the filtering does not affect any other part
    // of the program.

    var d = _.cloneDeep(data);

    if(!(d instanceof Array)) {
        d = [d];
    }


    // Find where the corresponding device is
    var idx = _.findIndex(this.config.devices, function(device) {
        return device.id === id;
    });


    for(var j=0; j< d.length; j++) {
        for(var key in d[j].parameters) {
            if(!this.config.devices[idx].parameters[key]) {
                delete d[j].parameters[key];
            }
        }
    }

    // Get max records authorized from device
    // General options can be specified in config an overridden by device
    var specOptions = this.config.devices[idx].sqlite || {};
    var defaultOptions = this.config.sqlite || {};

    _.defaults(specOptions, defaultOptions);

    if(_.isEmpty(specOptions)) {
        debug('No database configuration specified for device', this.config.devices[idx].id, ' therefore not saving to database');
        return;
    }

    db.save(d, specOptions);
}