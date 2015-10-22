'use strict';

var scores = require('../lib/scores');
var config = require('../configs/config');
var data = require('./database/data');
var database = require('../db/database');
var moment = require('moment');

// correct time
var cTime = '1999-12-31T06:00:00.0-0500';

config.addConfiguration('test/dbtest');

function doData(d) {
    data.setName('$Z');
    data.clearData();
    data.addData(d);
}

var complexData = [
    {data: [2600, 0, 40000], time: cTime},
    {data: [2800, 4500, 32500], time: moment(cTime).add(1, 'hour')},
    {data: [3000, 6500, 38000], time: moment(cTime).add(2, 'hour')}
];

describe('Test temperature scores', function () {
    before(function () {
        return data.drop();
    });

    afterEach(function () {
        return data.drop();
    });

    //it('should be rejected', function() {
    //    return scores.temperature('$Z').should.be.rejectedWith('Database does not exist');
    //});

    it('1 value', function () {
        doData([{data: [2700, 0, 0], time: cTime}]);
        return data.saveFast().then(function () {
            return scores.temperature('$Z');
        }).should.be.eventually.equal(50);
    });

    it('complex case', function () {
        doData(complexData);
        return data.saveFast().then(function () {
            return scores.temperature('$Z');
        }).should.be.eventually.equal(25);
    });
});

describe('Test light scores', function () {
    before(function () {
        return data.drop();
    });

    afterEach(function () {
        return data.drop();
    });

    it('complex case', function () {
        doData(complexData);
        return data.saveFast().then(function () {
            return scores.luminosity('$Z');
        }).should.be.eventually.be.approximately(10, 0.0001);
    });
});

describe('Test humidity scores', function () {
    before(function () {
        return data.drop();
    });

    afterEach(function () {
        return data.drop();
    });

    it('complex case', function () {
        doData(complexData);
        return data.saveFast().then(function () {
            return scores.humidity('$Z');
        }).should.be.eventually.be.approximately(10, 0.0001);
    });
});

//describe('Test all', function() {
//    before(function () {
//        return data.drop();
//    });
//
//    afterEach(function () {
//        return data.drop();
//    });
//
//    it('complex case', function () {
//        doData(complexData);
//        return data.saveFast().then(function () {
//            return scores.all('$Z');
//        }).should.be.eventually.be.approximately(10, 0.0001);
//    });
//});