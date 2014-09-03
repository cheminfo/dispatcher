"use strict";
var _ = require('lodash');
var requestManager, config;
exports = module.exports = {
    init: function(cfg, reqManager) {
        requestManager = reqManager;
        config = _.cloneDeep(cfg);
        // Every x seconds, update epoch of all devices
        var delay= config.refreshEpoch || 10000;	// delay in ms
        var sendEvent=function() {
            for(var i=0; i<config.devices.length; i++) {
                (function(i) {
                    var now = Math.round(new Date().getTime()/1000); // now in seconds
                    requestManager.addRequest(config.devices[i].prefix+'e'+now);
                })(i)
            }
        };


        setIntervalAndExecute(sendEvent, delay);
    }

};

function setIntervalAndExecute(fn, t) {
    fn();
    return(setInterval(fn, t));
}