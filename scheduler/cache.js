"use strict";
var _ = require('lodash'),
    debug = require('debug')('cache'),
    parser = require('../lib/parser');


var data = {};
var cache = exports = module.exports = {
    // Regularly send the 'c' command to the device
    init: function(config, requestManager, options) {
        this.options = options || {};
        data.cfg = _.cloneDeep(config.devices);
        data.status = {};
        data.entry = {};
        // Every 5 seconds, get status of devices
        var delay= options.delay || 2000;
        var sendEvent=function() {
            for(var i=0; i<data.cfg.length; i++) {
                (function(i) {
                    var nbParam = data.cfg[i].nbParam;
                    var cmd = data.cfg[i].prefix+'c';
                    requestManager.addRequest(cmd).then(function(response) {
                        var entries = parser.parse(cmd, response, {
                            nbParam: nbParam
                        });
                        var id =  data.cfg[i].id;
                        var status = data.status[id] = data.status[id] || {};
                        data.entry[id] = data.entry[id] || {};

                        if(entries.length > 1) {
                            debug('Unexpected error..., ', entries.length, 'entries when 1 expected');
                        }

                        status.lastTrial = new Date().getTime();
                        status.active = (entries.length === 1);
                        if(status.active) {
                            status.lastUpdate = entries[0].epoch;
                            status.nbFailures = 0;
                            data.entry[id] = {};
                            data.entry[id].parameters = [];
                            data.entry[id].epoch = entries[0].epoch;
                            data.entry[id].deviceId = entries[0].deviceId;
                            for(var key in entries[0].parameters) {
                                    data.entry[id].parameters.push({
                                        name: key,
                                        mappedName: data.cfg[i].parameters[key] ? data.cfg[i].parameters[key].name : 'NA',
                                        value: entries[0].parameters[key],
                                        label: data.cfg[i].parameters[key] ? data.cfg[i].parameters[key].label : 'NA'
                                    });
                                }

                        }
                        else {
                            status.nbFailures = status.nbFailures ?  (status.nbFailures+1) : 1;
                        }
                    });
                })(i)
            }
        };


        setInterval(sendEvent, delay);
    },

    data: data


};

