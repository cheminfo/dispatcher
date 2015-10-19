'use strict';

var database = require('../db/database'),
    config = require('../configs/config'),
    _ = require('lodash'),
    Filter = require('../lib/filter'),
    moment = require('moment');

var filter = new Filter();

var TEMPERATURE_MAX_POINTS = 50;
var LUMINOSITY_MAX_POINTS = 20;
var HUMIDITY_MAX_POINTS = 20;
var TOTAL_AVAILABLE = 90;

function temperature(deviceId, param) {
    // ref should actually be retrieven from another device
    //var tMax = 0.255 * tExt + 19.9;
    //var tMin = 0.255 * tExt + 17.9;

    var tMax = 29;
    var tMin = 26;

    var device = config.findDeviceById(deviceId);

    if(!param) {
        param = config.getParamByName(deviceId, 'temperature');
    }

    if (!param) {
        return Promise.resolve(null);
    }

    var options = device.sqlite || {};
    options.mean = 'minute';
    options.limit = 100;
    options.fields = param;

    return database.get(deviceId, options).then(function (data) {
        var mean = filter.normalizeData(data, deviceId);
        mean = mean.filter(function (m) {
            var h = moment(m.epoch).format('HH');
            return h >= 6 && h <= 18;
        });
        mean = _.pluck(mean, param);
        mean = mean.filter(isNotNull)
        if (mean.length === 0) return null;
        var calc = getTempCalc(tMin, tMax);
        var points = TEMPERATURE_MAX_POINTS * mean.reduce(function (prev, current) {
                return Math.min(prev, calc(current));
            }, 1);
        return points;
    });
}

function humidity(deviceId, param) {
    var device = config.findDeviceById(deviceId);

    if(!param) {
        param = config.getParamByName(deviceId, 'humidity');
    }

    if (!param) {
        return Promise.resolve(null);
    }

    var options = device.sqlite || {};
    options.mean = 'minute';
    options.limit = 100;
    options.fields = param;

    return database.get(deviceId, options).then(function (data) {
        var mean = filter.normalizeData(data, deviceId);
        mean = _.pluck(mean, param);
        mean = mean.filter(isNotNull);
        if (mean.length === 0) return null;
        var points = HUMIDITY_MAX_POINTS * mean.reduce(function (prev, current) {
                return Math.min(prev, humidityCalc(current));
            }, 1);
        return points;
    });
}

function luminosity(deviceId, param) {
    var dayLuminosity = 400 / 0.04;
    var device = config.findDeviceById(deviceId);

    if(!param) {
        param = config.getParamByName(deviceId, 'luminosity');
    }

    if (!param) {
        return Promise.resolve(null);
    }

    var options = device.sqlite || {};
    options.mean = 'minute';
    options.limit = 100;
    options.fields = param;

    return database.get(deviceId, options).then(function (data) {
        var mean = filter.normalizeData(data, deviceId);
        mean = mean.filter(function (m) {
            var h = moment(m.epoch).format('HH');
            return h >= 6 && h <= 18;
        });
        mean = _.pluck(mean, param);
        mean = mean.filter(isNotNull);
        if (mean.length === 0) return null;

        var calc = getLuminosityCalc(dayLuminosity);
        var points = LUMINOSITY_MAX_POINTS * mean.reduce(function (prev, current) {
                return Math.min(prev, calc(current));
            }, 1);
        return points;
    });
}

function getTempCalc(tMin, tMax) {
    return function (t) {
        if (t >= tMin && t <= tMax) {
            return 1;
        } else if (t > tMax) {
            return Math.max(0, (1 - (t - tMax) / 2));
        } else if (t < tMin) {
            return Math.max(0, (1 - (tMin - t) / 2));
        }
    }
}

function getLuminosityCalc(luminosity) {
    return function (l) {
        var relLuminosity = l / luminosity;
        if (relLuminosity <= 0.025) {
            return 0;
        } else if (relLuminosity > 0.025 && relLuminosity < 0.04) {
            return 1 / 0.015 * relLuminosity - 0.025 / 0.015;
        } else {
            return 1;
        }
    }
}

function humidityCalc(h) {
    if(h > 70) return 0;
    if(h > 60) return (70 - h) / 10;
    return 1;
}

function all(deviceId) {
    var prom = new Array(3);
    prom[0] = exports.temperature(deviceId);
    prom[1] = exports.luminosity(deviceId);
    prom[2] = exports.humidity(deviceId);

    return Promise.all(prom).then(function(data) {
        var total = 1;
        if(data.some(function(v) {
            return v === null;
        })) total = null;
        else {
            total = data.reduce(function(a, b) {
                return a + b;
            });
        }
        return {
            temperatureAvailable: TEMPERATURE_MAX_POINTS,
            luminosityAvailable: LUMINOSITY_MAX_POINTS,
            humidityAvailable: HUMIDITY_MAX_POINTS,
            temperature: data[0],
            luminosity: data[1],
            humidity: data[2],
            total: total,
            totalAvailable: TOTAL_AVAILABLE
        }
    });
}

function isNotNull(val) {
    return val !== null;
}

exports = module.exports = {
    temperature: temperature,
    humidity: humidity,
    luminosity: luminosity,
    all: all
};

