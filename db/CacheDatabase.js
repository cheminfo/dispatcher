// This class will listen to a given cache instance
// And write new entries to the database
// The cache instance should implement EventEmitter

var debug = require('debug')('CacheDatabase'),
    db = require('./database'),
    _ = require('lodash');

var CacheDatabase = exports = module.exports = function CacheDatabase(cache) {
    this.cache = cache;
    this.config = require('../configs/config').get();
    this.cache.on('newdata', function(data) {

    });

};

CacheDatabase.prototype.start = function() {
    this.cache.on('newdata', onNewData);
};

CacheDatabase.prototype.stop = function() {
    this.cache.removeListener('newdata', onNewData);
};

function onNewData(id, data) {
    // Keep only the parameters that are explicitly defined in the
    // configuration of the devices

    // Make a copy so that the filtering does not affect any other part
    // of the program.
    var d = _.cloneDeep(data);
    d.parameters = {};

    // Find where the corresponding device is
    var idx = _.findIndex(this.config.devices, function(device) {
        return device.id === id;
    });

    for(var key in data.parameters) {
        if(this.config.devices[idx].parameters[key]) {
            d.parameters[key] = data.parameters[key];
        }
    }

    debug('CacheDatabased received new data from cache');
    db.save(d);
}