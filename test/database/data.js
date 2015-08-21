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
var d1 = [];
var d2 = [];



function getTime(idx) {
    var t, time = new Date('2000-01-01').getTime();
    switch (idx) {
        case 0:
        case 1:
            t = time;
            break;
        case 2:
        case 3:
            t = time + MINUTE;
            break;
        case 4:
        case 5:
            t = time + HOUR;
            break;
        case 6:
            t = time + DAY;
            break;
        default:
            t = time + 2 * DAY;
            break;
    }

    return Math.round(t / SECOND);
}
function toParams(v, j) {
    var epoch = getTime(j);
    var obj = {parameters: {}, deviceId: dbName, epoch: epoch};
    for (var i = 0; i < v.length; i++) {
        obj.parameters[params[i]] = v[i];
    }
    return obj;
}

function saveData1Fast() {
    return database.saveFast(d1, options);
}

function saveData2Fast() {
    return database.saveFast(d2, options);
}

function saveData1() {
    return database.save(d1, options);
}

function saveData2() {
    return database.save(d2, options);
}

function save() {
    return saveData1().then(saveData2);
}

function saveFast() {
    return saveData1Fast().then(saveData2Fast);
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
    setData1: function(data) {
        d1 = data;
        d1 = d1.map(toParams);

    },
    setData2: function(data) {
        d2 = data;
        d2 = d2.map(toParams);
    },
    setName: function(name) {
        dbName = name;
        exports.name = name;
    }
};
