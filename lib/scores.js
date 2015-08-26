'use strict';

var database = require('../db/database'),
    config = require('../configs/config'),
    _ = require('lodash'),
    Filter = require('../lib/filter'),
    moment = require('moment');

var filter = new Filter();

function temperature(deviceId) {
    // ref should actually be retrieven from another device
    //var tMax = 0.255 * tExt + 19.9;
    //var tMin = 0.255 * tExt + 17.9;

    var tMax = 29;
    var tMin = 26;

    var device = config.findDeviceById(deviceId);
    var param = config.getParamByName(deviceId, 'temperature');


    if(!param) {
        return Promise.resolve(null);
    }

    var options = device.sqlite || {};
    options.mean = 'minute';
    options.limit = 100;
    options.fields = param;

    return database.get(deviceId, options).then(function(data) {
        var mean = filter.normalizeData(data, deviceId);
        mean = mean.filter(function(m) {
            var h = moment(m.epoch).format('HH');
            return h >= 6 && h <= 18;
        });
        mean = _.pluck(mean, param);
        if(mean.length === 0) return null;

        var calc = getTempCalc(tMin, tMax);
        var points = mean.reduce(function(prev, current) {
            return Math.min(prev, calc(current));
        }, 100);
        return points;
    });
}

function humidity() {

}

function light() {

}

function getTempCalc(tMin, tMax) {
    return function(t) {
        if(t >= tMin && t <= tMax) {
            return 100;
        } else if(t > tMax) {
            return Math.max(0, 100 * (1 - (t - tMax) / 2));
        } else if(t < tMin) {
            return Math.max(0, 100 * (1 - (tMin - t) / 2));
        }
    }
}

exports = module.exports = {
    temperature: temperature,
    humidity: humidity,
    light: light
};