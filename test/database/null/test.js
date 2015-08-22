'use strict';

var data = require('../data');
var dataset = require('./dataset');
var database = require('../../../db/database');

function cleanEntries(entries) {
    entries.forEach(function(entry) {
        delete entry.timestamp;
        delete entry.id;
    });
}

describe('Save null values (normal save)', function() {
    before(function() {
        data.setName('dbnull');
        data.clearData();
        data.addData([[null, null, null], [null, null, null], [6, 2, 6], [null, null, 1], [2, 3, 4], [9, null, null], [1, 4, 3],[4,null, null]]);
        data.addData([[6, null, null], [null, 8, null]]);
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