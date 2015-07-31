'use strict';

var database = require('../db/database');
var _ = require('lodash');
var Timer = require('../util/Timer');
var argv = require('minimist')(process.argv.slice(2));


// Generate some data
var nbParam = argv.params || 5;
var params = new Array(nbParam);
var c = 0;
var charCode = 'A'.charCodeAt(0) -1 ;
params = _.map(params, function() {
   return String.fromCharCode(++charCode);
});

var n = argv.entries || 20;
var d = new Array(n);
var dummy = createData();
d = _.map(d, createData);


var options = {
    "dir": __dirname + '/../sqlite',
    "maxRecords": {
        "entry": 100000,
        "minute": 10000,
        "hour": 7200,
        "day": 300
    }
};

function createData() {
    var obj = {parameters:{}, deviceId: 'dbperf', epoch: Date.now()};
    for(var i=0; i<params.length; i++) {
        obj.parameters[params[i]] = Math.floor((Math.random()+1)*10);
    }
    return obj;
}

function dbSave() {
        return database.save(d, options);
}

function dbSaveFast() {
        return database.saveFast(d, options);

}

function dbDrop() {
        return database.drop('dbperf', options);
}

function saveDummy() {
    return database.save(dummy, options);
}




function timerStep(msg) {
    return function() {
        console.log(msg + ' ' + timer.step('ms'));
    }
}

console.log('Test database performance');
console.log('Saving ' + n + ' entries with ' + params.length + ' parameters\n');

var timer = new Timer();
timer.start();

Promise.resolve()
    .then(dbDrop)
    .then(saveDummy).then(timerStep('initial drop and dummy save\t'))
    .then(dbSave).then(timerStep('normal save\t\t\t'))
    .then(dbDrop)
    .then(saveDummy).then(timerStep('Second drop and dummy save\t'))
    .then(dbSaveFast).then(timerStep('fast save\t\t\t'))
    .catch(handleError);


function handleError(err) {
    console.log('Error', err);
}
