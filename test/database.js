'use strict';

var dataset = require('./dataset.json');
var data = require('./data');
var database = require('../db/database');
var _ = require('lodash');
var maxId = Math.max.apply(null, _.pluck(dataset.entries, 'id'));
var lastEntry = _.filter(dataset.entries, function (e) {
    return e.id === maxId;
})[0];

describe('Test database with normal save', function () {
    before(function () {
        return data.drop();
    });

    beforeEach(function () {
        return data.save();
    });

    afterEach(function () {
        return data.drop();
    });

    it('save entries', function () {
        return data.getEntries()
            .then(function (records) {
                records = records.map(function (r) {
                    delete r.timestamp;
                    return r;
                });
                records.should.eql(dataset.entries);
            });
    });

    it('save minute', function () {
        return data.getMeanEntries('minute')
            .then(function (records) {

                records.should.eql(dataset.minutes)
            })
    });

    it('save hour', function () {
        return data.getMeanEntries('hour')
            .then(function (records) {
                records.should.eql(dataset.hours);
            });
    });

    it('save day', function () {
        return data.getMeanEntries('day')
            .then(function (records) {
                records.should.eql(dataset.days);
            });
    });
});

describe('Test database with fast save', function () {
    before(function () {
        return data.drop();
    });

    beforeEach(function () {
        return data.saveFast();
    });

    afterEach(function () {
        return data.drop();
    });

    it('save entries fast ', function () {
        return data.getEntries()
            .then(function (records) {
                records = records.map(function (r) {
                    delete r.timestamp;
                    return r;
                });
                records.should.eql(dataset.entries);
            });
    });

    it('save fast minute', function () {
        return data.getMeanEntries('minute')
            .then(function (records) {

                records.should.eql(dataset.minutes)
            })
    });

    it('save fast hour', function () {
        return data.getMeanEntries('hour')
            .then(function (records) {
                records.should.eql(dataset.hours);
            });
    });

    it('save fast day', function () {
        return data.getMeanEntries('day')
            .then(function (records) {
                records.should.eql(dataset.days);
            });
    });
});

describe('test database getters', function () {
    before(function () {
        return data.drop();
    });

    beforeEach(function () {
        return data.saveFast();
    });

    afterEach(function () {
        return data.drop();
    });

    it('should get the last entry', function () {
        return database.last('dbtest').then(function (data) {
            delete data.timestamp;
            data.should.eql(lastEntry);
        });
    });

    it('reading a database that does not exist should reject', function () {
        return database.get('notexist').then(function () {
            throw new Error('Promise was unexpectedly fullfilled');
        }, function (err) {
            err.should.be.an.instanceof(Error);
            err.message.should.eql('Database does not exist');
        });
    });
});


