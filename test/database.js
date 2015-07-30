'use strict';

var database = require('../db/database');
var _ = require('lodash');

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;


var params = [0, 0, 0];
var charCode = 'A'.charCodeAt(0) - 1;
params = params.map(function () {
    return String.fromCharCode(++charCode);
});
var d1 = [[1, 9, 3], [4, 3, 7], [6, 2, 6], [1, 1, 1], [2, 3, 4], [9, 7, 4], [1, 4, 3]];
d1 = d1.map(toParams);
var d2 = [[6, 4, 7], [0, 8, 5]];
d2 = d2.map(toParams);


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
        default:
            t = time + DAY;
            break;
    }

    return Math.round(t / SECOND);
}
function toParams(v, j) {
    var x = getTime(j);
    var obj = {parameters: {}, deviceId: 'dbtest', epoch: x};
    for (var i = 0; i < v.length; i++) {
        obj.parameters[params[i]] = v[i];
    }
    return obj;
}
var options = {
    "dir": __dirname + '/../sqlite',
    "maxRecords": {
        "entry": 100000,
        "minute": 10000,
        "hour": 7200,
        "day": 300
    }
};

function saved1Fast() {
    return database.saveFast(d1, options);
}

function saved2Fast() {
    return database.saveFast(d2, options);
}

function saved1() {
    return database.save(d1, options);
}

function saved2() {
    return database.save(d2, options);
}



function getEntries() {
    delete options.mean;
    delete options.fields;
    return database.get('dbtest', options);
}

function getMeanEntries(mean) {
    return database.get('dbtest', _.assign(options, {
        mean: mean,
        fields: params
    }));
}

describe('Test database with normal save', function () {
    before(function () {
        return database.drop('dbtest', options);
    });

    beforeEach(function () {
        return saved1().then(saved2);
    });

    afterEach(function () {
        return database.drop('dbtest', options);
    });

    it('save entries', function () {
        return getEntries()
            .then(function (records) {
                records = records.map(function (r) {
                    delete r.timestamp;
                    return r;
                });
                records.should.eql(entries);
            });
    });

    it('save minute', function () {
        return getMeanEntries('minute')
            .then(function (records) {

                records.should.eql(minutes)
            })
    });

    it('save hour', function () {
        return getMeanEntries('hour')
            .then(function (records) {
                records.should.eql(hours);
            });
    });

    it('save day', function () {
        return getMeanEntries('day')
            .then(function (records) {
                records.should.eql(days);
            });
    });
});

describe('Test database with fast save', function () {
    before(function () {
        return database.drop('dbtest', options);
    });

    beforeEach(function () {
        return saved1Fast().then(saved2Fast);
    });

    afterEach(function () {
        return database.drop('dbtest', options);
    });

    it('save entries fast ', function () {
        return getEntries()
            .then(function (records) {
                records = records.map(function (r) {
                    delete r.timestamp;
                    return r;
                });
                records.should.eql(entries);
            });
    });

    it('save fast minute', function () {
        return getMeanEntries('minute')
            .then(function (records) {

                records.should.eql(minutes)
            })
    });

    it('save fast hour', function () {
        return getMeanEntries('hour')
            .then(function (records) {
                records.should.eql(hours);
            });
    });

    it('save fast day', function () {
        return getMeanEntries('day')
            .then(function (records) {
                records.should.eql(days);
            });
    });
});

var entries = [
    {
        id: 7,
        epoch: 946771200,
        A: 1,
        B: 4,
        C: 3
    },
    {
        id: 6,
        epoch: 946688400,
        A: 9,
        B: 7,
        C: 4
    },
    {
        id: 5,
        epoch: 946688400,
        A: 2,
        B: 3,
        C: 4
    },
    {
        id: 4,
        epoch: 946684860,
        A: 1,
        B: 1,
        C: 1
    },
    {
        id: 3,
        epoch: 946684860,
        A: 6,
        B: 2,
        C: 6
    },
    {
        id: 9,
        epoch: 946684800,
        A: 0,
        B: 8,
        C: 5
    },
    {
        id: 8,
        epoch: 946684800,
        A: 6,
        B: 4,
        C: 7
    },
    {
        id: 2,
        epoch: 946684800,
        A: 4,
        B: 3,
        C: 7
    },
    {
        id: 1,
        epoch: 946684800,
        A: 1,
        B: 9,
        C: 3
    }
];

var minutes = [
    {
        A_min: 1,
        A_max: 1,
        B_min: 4,
        B_max: 4,
        C_min: 3,
        C_max: 3,
        A_mean: 1,
        B_mean: 4,
        C_mean: 3,
        epoch: 946771200
    },
    {
        A_min: 2,
        A_max: 9,
        B_min: 3,
        B_max: 7,
        C_min: 4,
        C_max: 4,
        A_mean: 5,
        B_mean: 5,
        C_mean: 4,
        epoch: 946688400
    },
    {
        A_min: 1,
        A_max: 6,
        B_min: 1,
        B_max: 2,
        C_min: 1,
        C_max: 6,
        A_mean: 3,
        B_mean: 1,
        C_mean: 3,
        epoch: 946684860
    },
    {
        A_min: 0,
        A_max: 6,
        B_min: 3,
        B_max: 9,
        C_min: 3,
        C_max: 7,
        A_mean: 2,
        B_mean: 6,
        C_mean: 5,
        epoch: 946684800
    }
];

var hours = [
    {
        A_min: 1,
        A_max: 1,
        B_min: 4,
        B_max: 4,
        C_min: 3,
        C_max: 3,
        A_mean: 1,
        B_mean: 4,
        C_mean: 3,
        epoch: 946771200
    },
    {
        A_min: 2,
        A_max: 9,
        B_min: 3,
        B_max: 7,
        C_min: 4,
        C_max: 4,
        A_mean: 5,
        B_mean: 5,
        C_mean: 4,
        epoch: 946688400
    },
    {
        A_min: 0,
        A_max: 6,
        B_min: 1,
        B_max: 9,
        C_min: 1,
        C_max: 7,
        A_mean: 3,
        B_mean: 4,
        C_mean: 4,
        epoch: 946684800
    }
];

var days = [
    {
        A_min: 1,
        A_max: 1,
        B_min: 4,
        B_max: 4,
        C_min: 3,
        C_max: 3,
        A_mean: 1,
        B_mean: 4,
        C_mean: 3,
        epoch: 946771200
    },
    {
        A_min: 0,
        A_max: 9,
        B_min: 1,
        B_max: 9,
        C_min: 1,
        C_max: 7,
        A_mean: 3,
        B_mean: 4,
        C_mean: 4,
        epoch: 946684800
    }
];

