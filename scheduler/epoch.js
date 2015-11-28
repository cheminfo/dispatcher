"use strict";
var _ = require('lodash');
var debug = require('debug')('scheduler:epoch');

var EpochScheduler = exports = module.exports = function EpochScheduler(reqManager, config) {
    this.config = config;
    this.requestManager = reqManager;
};

EpochScheduler.prototype.start = function () {
    var that = this;

    // Every x seconds, update epoch of all devices
    var delay = that.config.epochRefreshInterval;
    var sendEvent = function () {
        for (var i = 0; i < that.config.devices.length; i++) {
            (function (i) {
                var now = Math.round(Date.now() / 1000); // now in seconds
                that.requestManager.addRequest(that.config.devices[i].prefix + 'e' + now).then(function () {
                    debug('set epoch request succeeded');
                }, function () {
                    debug('set epoch request failed');
                });
            })(i)
        }
    };
    if (!this.interval) {
        this.interval = setIntervalAndExecute(sendEvent, delay);
    }
};

EpochScheduler.prototype.stop = function () {
    if (this.interval) {
        clearInterval(this.interval);
        this.interval = null;
    }
};


// A version of setInterval that executes as soon as it is called
function setIntervalAndExecute(fn, t) {
    fn();
    return (setInterval(fn, t));
}