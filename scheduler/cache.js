"use strict";
var _ = require('lodash'),
    debug = require('debug')('cache'),
    parser = require('../lib/parser');


var data = {};
var cache = exports = module.exports = {
    init: function(config, requestManager, options) {
        this.options = options || {};
        data.cfg = _.cloneDeep(config.devices);
        data.status = {};
        data.param = {};
        // Every 5 seconds, get status of devices
        var delay= options.delay || 2000;
        var sendEvent=function() {
            for(var i=0; i<data.cfg.length; i++) {
                (function(i) {
                    var cmd = data.cfg[i].prefix+'c';
                    requestManager.addRequest(cmd , 8+26*4+2).then(function(response) {
                        var entries = parser.parse(cmd, response);
                        var id =  data.cfg[i].id;
                        var status = data.status[id] = data.status[id] || {};
                        data.param[id] = data.param[id] || {};

                        if(entries.length > 1) {
                            debug('Unexpected error..., ', entries.length, 'entries when 1 expected');
                        }

                        status.lastTrial = new Date().getTime();
                        status.active = (entries.length === 1);
                        if(status.active) {
                            status.lastUpdate = entries[0].epoch;
                            status.nbFailures = 0;
                            data.param[id] = entries[0];
                            data.param[id] = [];
                            for(var key in entries[0]) {
                                    data.param[id].push({
                                        name: key,
                                        mappedName: data.cfg[i].parameters[key] ? data.cfg[i].parameters[key].name : 'NA',
                                        value: entries[0][key],
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

