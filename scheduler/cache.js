"use strict";
var _ = require('lodash'),
    EventEmitter = require('events').EventEmitter,
    debug = require('debug')('cache'),
    database = require('../db/database'),
    parser = require('../lib/parser'),
    Promise = require('bluebird');

var lastIds = {};
var doingMultiLog = false;
var data = {};
var Cache = exports = module.exports = function Cache(requestManager, options) {
    this.interval = null;
    this.config = require('../configs/config').get();
    this.requestManager = requestManager;

    this.options = options || {};
    this.data = {};
    this.data.devices = this.config.devices;
    this.data.status = {};
    this.data.entry = {};
    this.data.deviceIds = {};
};


Cache.prototype.__proto__ = EventEmitter.prototype;

Cache.prototype.get = function(key) {
    return this.data[key];
};

Cache.prototype.start = function() {
    var that = this;
    var delay= this.options.delay || this.config.cacheRefreshInterval;
    if(!delay) throw new Error('Cache: no interval specified');
    var sendEvent=function() {
        for(var i=0; i<that.data.devices.length; i++) {
            (function(i) {

                // The command depends if the device is a multilog
                // We use c for non-multi-log
                // And m for multi-log
                var multiLog = that.data.devices[i].multiLog;


                if(multiLog && !doingMultiLog) {
                    getLastId(that, that.data.devices[i]).then(function(lastId) {
                        lastIds[that.data.devices[i].id] = lastId || 0;
                        doMultilogRequest(that, that.data.devices[i]);
                    }).catch(function() {
                        // TODO: Be more specific. Do this only if error is that table entry does not exist...
                        lastIds[that.data.devices[i].id] = 0;
                        doMultilogRequest(that, that.data.devices[i]);
                    });
                }
                else if(!multiLog){
                    doCRequest(that, that.data.devices[i]);
                }
            })(i)
        }
    };
    if(!this.interval) {
        this.interval = setInterval(sendEvent, delay);
    }
};

function doMultilogRequest(that, device) {
    debug('do multilog request', lastIds[device.id]);
    var lastId = lastIds[device.id];
    doingMultiLog = true;
    var cmd = 'm' + lastId;

    // Enforce longer timeout for the m command
    return that.requestManager.addRequest(cmd, {
        timeout: 1000
    }).then(function(response) {
        var entries = parser.parse(cmd, response);

        var id =  device.id;
        that.data.status[id] = that.data.status[id] || { id: id};
        var status = that.data.status[id];
        that.data.entry[id] = that.data.entry[id] || {};

        status.lastTrial = new Date().getTime();
        if(entries.length === 0) {
            debug('Unexpected error... m command should return at least 1 result');
            doingMultiLog = false;
            return;
        }

        status.active = (entries.length >= 1);
        if(status.active) {
            that.data.deviceIds[id] = entries[0].deviceId;
            status.nbFailures = 0;

        }
        if(entries.length === 1) {
            doingMultiLog = false;

            // Nothing to do
        }

        if(entries.length > 1) {
            debug('m returned ', entries.length-1, 'new entries');
            that.data.entry[id] = _.last(entries);
            status.lastUpdate = entries[entries.length-1].epoch;
            lastIds[device.id] = entries[entries.length-1].id;
            that.emit('newdata', device.id, entries.slice(1));
            doMultilogRequest(that, device);
        }

        if(entries.length === 0) {
            status.nbFailures = status.nbFailures ?  (status.nbFailures+1) : 1;
        }

        return entries.length;
    }, function(err) {
        debug('rejected...', err);
        var status = that.data.status[device.id];
        status.nbFailures = status.nbFailures ?  (status.nbFailures+1) : 1;
        doingMultiLog = false;
    });
}

function doCRequest(that, device) {
    debug('do c request');
    var nbParam = device.nbParam;
    var cmdLetter = 'c';
    var cmd = device.prefix + cmdLetter;
    return that.requestManager.addRequest(cmd).then(function(response) {
        debug('Request done');

        // Pass the response given by the serial device to the parser
        var entries = parser.parse(cmd, response, {
            nbParam: nbParam
        });


        var id =  device.id;
        var status = that.data.status[id] || { id: id};
        that.data.entry[id] = that.data.entry[id] || {};


        if(entries.length > 1) {
            debug('Unexpected error..., ', entries.length, ', multilog is ', multiLog);
        }

        status.lastTrial = new Date().getTime();

        status.active = (entries.length === 1);
        if(status.active) {
            debug('active');
            that.data.deviceIds[id] = entries[0].deviceId;
            var isNew = (status.lastUpdate !== entries[0].epoch);
            status.lastUpdate = entries[0].epoch;
            status.nbFailures = 0;
            that.data.entry[id] = entries[0];
            that.emit('data', that.data.entry[id]);
            if(isNew) {
                that.emit('newdata', id, that.data.entry[id]);
            }

        }
        else {
            status.nbFailures = status.nbFailures ?  (status.nbFailures+1) : 1;
        }
    }, function(err) {
        debug('rejected...', err);
        var status = that.data.status[device.id];
        status.nbFailures = status.nbFailures ?  (status.nbFailures+1) : 1;
    });

}




function getLastId(that, device) {

    // If it is a multilog, we want to know what the last id is
    // We look in the cache, if we don't find it we look for the
    // last id in the database, if we don't find it we use the m
    // command
    if (lastIds[device.id]) return Promise.resolve(lastIds[device.id]);

    // Get the device id from database
    // that operation can fail for example if the database
    // Does not yet exist
    var cmd = device.prefix + 'q';
    return that.requestManager.addRequest(cmd).then(function(deviceId) {
        // Remove newline
        deviceId = deviceId.slice(0, deviceId.length-2);
        console.log('device id', deviceId);
        return database.getLastId(deviceId);
    });

}

Cache.prototype.stop = function() {
    if(this.interval) {
        clearInterval(this.interval);
        this.interval = null;
    }
};
