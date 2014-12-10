var database = require('../db/database');
var _ = require('lodash');

// Generate some data
var params = ['A', 'B'];

var n = 10;
var d = new Array(n);

d = _.map(d,function() {
    var obj = {parameters:{}, deviceId: 'dbperf', epoch: new Date().getTime()};
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
});