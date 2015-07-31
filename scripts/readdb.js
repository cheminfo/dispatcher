var database = require('../db/database');
var _ = require('lodash');
var Filter = require('../lib/filter');

// Generate some data
var nbParam = 3;
var params = new Array(nbParam);
var c = 0;
var charCode = 'A'.charCodeAt(0) -1 ;
params = _.map(params, function() {
    return String.fromCharCode(++charCode);
});
var deviceId = 'dbperf';

console.log(params);

var n = 20;
var d = new Array(n);

d = _.map(d,function(val, key) {
    var obj = {parameters:{}, deviceId: deviceId, epoch: new Date().getTime() + key*10000};
    for(var i=0; i<params.length; i++) {
        obj.parameters[params[i]] = Math.floor((Math.random()+1)*10);
    }
    return obj;
});


database.save(d, {
    "dir": "../sqlite",
    "maxRecords": {
        "entry": 100000,
        "minute": 10000,
        "hour": 7200,
        "day": 300
    }
}).then(function() {
    var fields = 'A,B,C';
    var mean = 'minute';
    var limit =  10;
    fields = fields.split(',');
    var options = {
        dir: '../sqlite',
        limit: limit,
        fields: fields,
        mean: mean
    };

    return database.get(deviceId, options);
}).then(function(result) {
    var filter = new Filter();
    console.log(filter.normalizeData(result, deviceId));
});

