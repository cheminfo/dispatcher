'use strict';

var data = require('../data');
var dataset = require('./dataset');
var database = require('../../../db/database');
var moment = require('moment');

function cleanEntries(entries) {
    entries.forEach(function(entry) {
        delete entry.timestamp;
        delete entry.id;
    });
}

var bTime = '1999-12-31T19:00:00.0-0500';

describe('Save null values (normal save)', function() {
    before(function() {
        data.setName('dbnull');
        data.clearData();
        data.addData([
            {data: [null, null, null], time: bTime},
            {data: [null, null, null], time: bTime},
            {data: [6, 2, 6], time: moment(bTime).add(1, 'minute')},
            {data: [null, null, 1], time: moment(bTime).add(1, 'minute')},
            {data: [2, 3, 4], time: moment(bTime).add(1, 'hour')},
            {data: [9, null, null], time: moment(bTime).add(1, 'hour')},
            {data: [1, 4, 3], time: moment(bTime).add(1, 'day')},
            {data: [4,null, null], time: moment(bTime).add(2, 'day')}
        ]);
        data.addData([
            {data: [6, null, null], time: bTime},
            {data: [null, 8, null], time: bTime}
        ]);
        return Promise.resolve().then(data.drop).then(data.save);
    });

    after(function() {
        return data.drop();
    });

    it('entries', function() {
         return data.getEntries().then(function(entries) {
             cleanEntries(entries);
             entries.should.eql(dataset.entries);
         });
    });

    it('mean (minute)', function() {
        return data.getMeanEntries('minute').then(function(entries) {
            cleanEntries(entries);
            entries.should.eql(dataset.minute);
        });
    });

    it('mean (hour)', function() {
        return data.getMeanEntries('hour').then(function(entries) {
            cleanEntries(entries);
            entries.should.eql(dataset.hour);
        });
    });

    it('mean (day)', function() {
        return data.getMeanEntries('day').then(function(entries) {
            cleanEntries(entries);
            entries.should.eql(dataset.day);
        });
    });
});

describe('Save null values (fast save)', function() {
    before(function() {
        return Promise.resolve().then(data.drop).then(data.saveFast);
    });

    after(function() {
        return data.drop();
    });

    it('entries', function() {
        return data.getEntries().then(function(entries) {
            cleanEntries(entries);
            entries.should.eql(dataset.entries);
        });
    });

    it('mean (minute)', function() {
        return data.getMeanEntries('minute').then(function(entries) {
            cleanEntries(entries);
            entries.should.eql(dataset.minute);

        });
    });

    it('mean (hour)', function() {
        return data.getMeanEntries('hour').then(function(entries) {
            cleanEntries(entries);
            entries.should.eql(dataset.hour);
        });
    });

    it('mean (day)', function() {
        return data.getMeanEntries('day').then(function(entries) {
            cleanEntries(entries);
            entries.should.eql(dataset.day);
        });
    });
});