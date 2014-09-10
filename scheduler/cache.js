"use strict";
var _ = require('lodash'),
    EventEmitter = require('events').EventEmitter,
    debug = require('debug')('cache'),
    parser = require('../lib/parser');


var data = {};
var Cache = exports = module.exports = function Cache(config, requestManager, options) {
    var that = this;
    this.options = options || {};
    this.data = {};
    this.data.cfg = _.cloneDeep(config.devices);
    this.data.status = {};
    this.data.entry = {};

    var delay= this.options.delay || 2000;
    var sendEvent=function() {
        for(var i=0; i<that.data.cfg.length; i++) {
            (function(i) {
                var nbParam = that.data.cfg[i].nbParam;
                var cmd = that.data.cfg[i].prefix+'c';
                requestManager.addRequest(cmd).then(function(response) {
                    debug('Request done');
                    var entries = parser.parse(cmd, response, {
                        nbParam: nbParam
                    });
                    var id =  that.data.cfg[i].id;
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
                                mappedName: that.data.cfg[i].parameters[key] ? that.data.cfg[i].parameters[key].name : 'NA',
                                value: entries[0].parameters[key],
                                label: that.data.cfg[i].parameters[key] ? that.data.cfg[i].parameters[key].label : 'NA'
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
    setInterval(sendEvent, delay);
};


Cache.prototype.__proto__ = EventEmitter.prototype;

Cache.prototype.get = function(key) {
    return this.data[key];
};
