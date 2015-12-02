'use strict';

const solarScores = require('solar-scores');
const config = require('../configs/config');
const database = require('../db/database');
var debug = require('debug')('scores');
module.exports = {};

module.exports.allFromGroup = function(group) {
    debug('all scores from group');
    var prom = [];
    var finalRes = {};
    var devices = config.findDevicesByGroup(group);
    debug('found ' + devices.length + ' devices in group ' + group);
    debug(devices);
    var extDevices = config.findDevicesByGroup('meteo');
    var temperatures = getParams(devices, 'temperature');
    var extTemperatures = getParams(extDevices, 'temperature');
    var humidities = getParams(devices, 'humidity');


    if(!temperatures.length || !extTemperatures.length) {
        prom.push(Promise.resolve('not available'));
    } else {
        prom.push(doTemperature(temperatures, extTemperatures));
    }
    if(!humidities.length) {
        prom.push(Promise.resolve('not available'));
    } else {
        prom.push(doHumidity(humidities));
    }

    return Promise.all(prom).then(function(results) {
        finalRes.temperature = results[0];
        finalRes.humidity = results[1];
        return finalRes;
    });
};

function doHumidity(humidities) {
    var prom = [];

    for(let i=0; i<humidities.length; i++) {
        prom.push(getData(humidities[i]));
    }

    return Promise.all(prom).then(function(data) {
        let hScore = new solarScores.Humidity({
            singleScoringParams: [60, 70]
        });

        for(let i=0; i<humidities.length; i++) {
            hScore.addSerie(data[i], humidities[i].param);
        }
        if(!data.length) {
            hScore.addSerie([], 'A');
        }
        return hScore.getScore();
    });
}

function doTemperature(temperatures, extTemperatures) {
    var prom = [];
    prom.push(getData(extTemperatures[0]));
    for(let i=0; i<temperatures.length; i++) {
        prom.push(getData(temperatures[i]))
    }

    return Promise.all(prom).then(function(data) {
        var tScore = new solarScores.Temperature();
        tScore.addExternal(data[0], extTemperatures[0].param);
        for(let i=0; i<temperatures.length; i++) {
            tScore.addInternal(data[i+1], temperatures[i].param);
        }

        return tScore.getScore();
    });
}

function getParams(devices, name) {
    var params = [];
    for(let i=0; i<devices.length; i++) {
        for(let key in devices[i].parameters) {
            if(devices[i].parameters[key].name === name) {
                params.push({
                    deviceId: devices[i].id,
                    param: key,
                    device: devices[i]
                });
            }
        }
    }
    return params;
}

function getData(param) {
    var options = param.device.sqlite || {};
    options.order = 'asc';
    options.fields = [param.param];
    return database.get(param.deviceId, options)
}