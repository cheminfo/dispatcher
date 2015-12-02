'use strict';

const solarScores = require('solar-scores');
const config = require('../configs/config');
const database = require('../db/database');
const Filter = require('../lib/filter');
var debug = require('debug')('scores');
module.exports = {};

var filter = new Filter();

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
    var freezing = getParams(devices, 'temp_freezer');
    var fridge = getParams(devices, 'temp_fridge');


    // 0: temperature
    if(!temperatures.length || !extTemperatures.length) {
        prom.push(Promise.resolve('not available'));
    } else {
        prom.push(doTemperature(temperatures, extTemperatures));
    }

    // 1: humidity
    if(!humidities.length) {
        prom.push(Promise.resolve('not available'));
    } else {
        prom.push(doHumidity(humidities));
    }

    // 2: freezing
    if(!freezing.length) {
        prom.push(Promise.resolve('not available'));
    } else {
        prom.push(doFreezing(freezing));
    }

    // 3: fridge
    if(!fridge.length) {
        prom.push(Promise.resolve('not available'));
    } else {
        prom.push(doRefrigeration(fridge));
    }


    return Promise.all(prom).then(function(results) {
        finalRes.temperature = results[0];
        finalRes.humidity = results[1];
        finalRes.freezing = results[2];
        finalRes.refrigeration = results[3];
        return finalRes;
    });
};

function doFreezing(freezing) {
    return getData(freezing[0]).then(function(data) {
        let score = new solarScores.Freezing({
            doubleScoringParams: [-34.5, -29, -17, -9.5]
        });

        return score.getScore(data, freezing[0].param);
    });
}

function doRefrigeration(refrigeration) {
    return getData(refrigeration[0]).then(function(data) {
        let score = new solarScores.Refrigeration({
            doubleScoringParams: [0, 1, 4.5, 5.5]
        });

        return score.getScore(data, refrigeration[0].param);
    });
}

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
        tScore.setExternal(data[0], extTemperatures[0].param);
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
    var options = {
        dir: param.device.sqlite.dir
    };
    options.order = 'asc';
    options.fields = [param.param];
    options.mean = 'entry';
    return database.get(param.deviceId, options).then(function(result) {
        return filter.normalizeData(result, param.deviceId);
    });
}