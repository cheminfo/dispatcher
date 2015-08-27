// Manages devices

'use strict';

var SerialQueueManager = require('../lib/SerialQueueManager'),
    EpochManager = require('../scheduler/epoch'),
    Cache = require('../scheduler/cache'),
    CacheDatabase = require('../db/CacheDatabase'),
    config = require('../configs/config'),
    debug = require('debug')('deviceManager'),
    _ = require('lodash'),
    path = require('path');

var appconfig = config.getAppconfig();
var caches=[], cachesHash={}, epochs=[], epochsHash={}, serialManagers=[], serialManagersHash={}, cacheDatabases=[];


function findDevice(id) {
    for (var i = 0; i < config.length; i++) {
        var d;
        if (d = config[i].findDeviceById(id)) {
            return d;
        }
    }
    return null;
}

function stopManagers() {
    debug('stop managers');
    var promises = [];
    for (var i = 0; i < serialManagers.length; i++) {
        promises.push(serialManagers[i].close());
    }
    return Promise.all(promises);
}

function stopSchedulers() {
    debug('stop schedulers');
    _.keys(caches).forEach(function (key) {
        caches[key].stop();
    });

    _.keys(epochs).forEach(function (key) {
        epochs[key].stop();
    });
}

function stopCacheDatabases() {
    for (var i = 0; i < cacheDatabases.length; i++) {
        cacheDatabases[i].stop();
    }
}

function restart() {
    process.chdir(path.join(__dirname, '../'));
    return Promise.resolve().then(function () {
        debug('restart');
        stopSchedulers();
        debug('schedulers stopped');
        return stopManagers().then(function () {
            debug('managers stopped');
            stopCacheDatabases();
            // Reset some vars

            // Load configuration file
            config.loadFromArgs();

            // The configuration variable
            var conf = config.config;

            // First level of config describes the plugged devices,
            // i.e. a device connected to the usb port
            // We have one serial manager per plugged device
            debug('number of usb devices ' + conf.length);
            for (var i = 0; i < conf.length; i++) {
                var serialManager = new SerialQueueManager(conf[i]);
                serialManager.init();
                var epochManager = new EpochManager(serialManager, conf[i]);
                epochManager.start();

                // Cache and Cache database
                var cache = new Cache(serialManager, conf[i]);

                if (conf[i].sqlite) {
                    var cacheDatabase = new CacheDatabase(cache, conf);
                    cacheDatabases.push(cacheDatabase);
                    cacheDatabase.start();
                }
                cache.start();

                caches.push(cache);
                epochs.push(epochManager);
                serialManagers.push(serialManager);
                for (var j = 0; j < conf[i].devices.length; j++) {
                    serialManagersHash[conf[i].devices[j].id] = serialManager;
                    cachesHash[conf[i].devices[j].id] = cache;
                    epochsHash[conf[i].devices[j].id] = epochManager;
                }
            }
        });
    });
}

exports = module.exports = {
    restart: restart,
    caches: caches,
    cachesHash: cachesHash,
    serialManagers: serialManagers,
    serialManagersHash: serialManagersHash,
    epochs: epochs,
    epochsHash: epochsHash
};
