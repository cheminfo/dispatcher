/*
    A helper to simplify the generation and saving
    of data in database tests
 */

'use strict';

var database = require('../../db/database');
var _ = require('lodash');

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

var dbName = 'dbtest';

var params = [0,0,0];
var charCode = 'A'.charCodeAt(0) - 1;
params = params.map(function () {
    return String.fromCharCode(++charCode);
});

var d = [];

function getTime(time) {
    var t = new Date(time).getTime();
    return Math.round(t / SECOND);
}

function toParams(v) {
    var epoch = getTime(v.time);
    var obj = {parameters: {}, deviceId: dbName, epoch: epoch};
    for (var i = 0; i < v.data.length; i++) {
        obj.parameters[params[i]] = v.data[i];
    }
    return obj;
}

function saveOne(i) {
    return function() {
        return database.save(d[i], options);
    }
}

function saveOneFast(i) {
    return function() {
        return database.saveFast(d[i], options);
    }
}

function save() {
    var prom = Promise.resolve();
    for(var i = 0; i < d.length; i++) {
        prom = prom.then(saveOne(i));
    }
    return prom;
}

function saveFast() {
    var prom = Promise.resolve();
    for(var i = 0; i < d.length; i++) {
        prom = prom.then(saveOneFast(i));
    }
    return prom;
}

function drop() {
    return database.drop(dbName, options);
}

function getEntries() {
    delete options.mean;
    delete options.fields;
    return database.get(dbName, options);
}

function getMeanEntries(mean) {
    return database.get(dbName, _.assign(options, {
        mean: mean,
        fields: params
    }));
}

function addData(data) {
    d.push(data.map(toParams));
}

function clearData() {
    d = [];
}

function setName(name) {
    dbName = name;
    exports.name = name;
}

var options = {
    "dir": __dirname + '/../../sqlite',
    "maxRecords": {
        "entry": 100000,
        "minute": 10000,
        "hour": 7200,
        "day": 300
    }
};

exports = module.exports = {
    getEntries: getEntries,
    getMeanEntries: getMeanEntries,
    save: save,
    saveFast: saveFast,
    drop: drop,
    addData: addData,
    clearData: clearData,
    setName: setName
};
