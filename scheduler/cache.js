"use strict";
var _ = require('lodash'),
    EventEmitter = require('events').EventEmitter,
    debug = require('debug')('cache'),
    parser = require('../lib/parser');


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
                var nbParam = that.data.devices[i].nbParam;
                var cmd = that.data.devices[i].prefix+'c';
                that.requestManager.addRequest(cmd).then(function(response) {
                    debug('Request done');
                    var entries = parser.parse(cmd, response, {
                        nbParam: nbParam
                    });
                    var id =  that.data.devices[i].id;
                    var status = that.data.status[id] = that.data.status[id] || {};
                    that.data.entry[id] = that.data.entry[id] || {};

                    if(entries.length > 1) {
                        debug('Unexpected error..., ', entries.length, 'entries when 1 expected');
                    }

                    status.lastTrial = new Date().getTime();
                    status.active = (entries.length === 1);
                    if(status.active) {
                        status.lastUpdate = entries[0].epoch;
                        status.nbFailures = 0;
                        that.data.entry[id] = {};
                        that.data.entry[id].parameters = [];
                        that.data.entry[id].epoch = entries[0].epoch;
                        that.data.entry[id].deviceId = entries[0].deviceId;
                        for(var key in entries[0].parameters) {
                            that.data.entry[id].parameters.push({
                                name: key,
                                mappedName: that.data.devices[i].parameters[key] ? that.data.devices[i].parameters[key].name : 'NA',
                                value: entries[0].parameters[key],
                                label: that.data.devices[i].parameters[key] ? that.data.devices[i].parameters[key].label : 'NA'
                            });
                        }
                        that.emit('data', that.data.entry);

                    }
                    else {
                        status.nbFailures = status.nbFailures ?  (status.nbFailures+1) : 1;
                    }
                }, function(err) {
                    debug('rejected...', err);
                });
            })(i)
        }
    };
    if(!this.interval) {
        this.interval = setInterval(sendEvent, delay);
    }
};

Cache.prototype.stop = function() {
    if(this.interval) {
        clearInterval(this.interval);
        this.interval = null;
    }
};
