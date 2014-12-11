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
var Cache = exports = module.exports = function Cache(requestManager, config, options) {
    this.intervals = [];
    this.config = config;
    this.requestManager = requestManager;

    this.options = options || {};
    this.data = {};
    this.data.devices = _.cloneDeep(this.config.devices);
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

    for(var i=0; i<that.data.devices.length; i++) {
        (function(i) {
            var delay= that.options.delay || that.data.devices[i].refresh || this.config.refresh;
            debug('Refresh cache every ' + delay + ' ms');
            if(!delay) throw new Error('Cache: no interval specified');
            var sendEvent=function() {
                // The command depends if the device is a multilog
                // We use c for non-multi-log
                // And m for multi-log
                var multiLog = that.data.devices[i].multiLog;


                if(multiLog && !doingMultiLog) {
                    debug('Updating multilog');
                    getLastId(that, that.data.devices[i]).then(function(lastId) {
                        debug('Last id successfully retrieved from database: ' + lastId);
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

            };
            that.intervals.push(setInterval(sendEvent, delay));
        })(i)

    }
};

function doMultilogRequest(that, device) {

    var lastId = lastIds[device.id];
    doingMultiLog = true;
    var cmd = device.prefix +  'm' + lastId;
    var id =  device.id;
    that.data.status[id] = that.data.status[id] || { id: id};
    var status = that.data.status[id];
    status.lastTrial = new Date().getTime();
    status.failure = '';
    debug('Send multilog command', cmd);
    return that.requestManager.addRequest(cmd).then(function(response) {
        var entries = parser.parse(cmd, response);
        that.data.entry[id] = that.data.entry[id] || {};


        status.active = (entries.length >= 1);
        if(status.active) {
            that.data.deviceIds[id] = entries[0].deviceId;
            status.nbFailures = 0;
        }

        if(entries.length === 0) {
            debug('Unexpected error... m command should return at least 1 result');
            doingMultiLog = false;
            status.nbFailures = status.nbFailures ?  (status.nbFailures+1) : 1;
            status.failure = 'Device did not respond';
        }

        if(entries.length === 1) {
            doingMultiLog = false;
        }

        if(entries.length > 1) {
            that.data.entry[id] = _.last(entries);
            status.lastUpdate = entries[entries.length-1].epoch;
            lastIds[device.id] = entries[entries.length-1].id;
            that.emit('newdata', device.id, entries.slice(1));
            doMultilogRequest(that, device);
        }

        return entries.length;
    }).catch(function(err) {
        var msg = (err instanceof Error) ? err.message : err;
        debug('rejected...', err);
        status.nbFailures = status.nbFailures ?  (status.nbFailures+1) : 1;
        status.failure  = msg;
        doingMultiLog = false;
    });
}

function doCRequest(that, device) {
    var nbParam = device.nbParam;
    var cmdLetter = 'c';
    var cmd = device.prefix + cmdLetter;
    var id =  device.id;
    that.data.status[id] = that.data.status[id] || { id: id};
    debug('send c command: ' + cmd);
    return that.requestManager.addRequest(cmd).then(function(response) {
        //debug('response to c command ' + cmd + ' received');
        var status = that.data.status[id];
        status.lastTrial = new Date().getTime();
        status.failure = '';
        // Pass the response given by the serial device to the parser
        try {
            var entries = parser.parse(cmd, response, {
                nbParam: nbParam
            });
        }
        catch(err) {
            status.nbFailures = status.nbFailures ?  (status.nbFailures+1) : 1;
            status.failure = err.message;
        }

        that.data.entry[id] = that.data.entry[id] || {};


        if(entries.length > 1) {
            debug('Unexpected error..., ', entries.length, ', multilog is ', multiLog);
        }

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
            that.data.entry[id].parameters = that.data.entry[id].parameters || {};
            status.nbFailures = status.nbFailures ?  (status.nbFailures+1) : 1;
            status.failure = 'Device did not respond';
        }
    }, function(err) {
        debug('rejected...', err);
        var msg = (err instanceof Error) ? err.message : err;
        var status = that.data.status[device.id];
        if(status) {
            status.lastTrial = new Date().getTime();
            status.nbFailures = status.nbFailures ?  (status.nbFailures+1) : 1;
            status.failure = msg;
        }
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
        return database.getLastId(deviceId);
    });

}

Cache.prototype.stop = function() {
    for(var i=0; i<this.intervals.length; i++) {
        if(this.intervals[i]) {
            clearInterval(this.intervals[i]);
        }
    }
    this.intervals = [];

};
