'use strict';

var request = require('supertest');
var app = require('../bootstrap/data-api-bootstrap');
var data = require('./database/data');
var dataset = require('./database/normal/dataset.json');
var _ = require('lodash');

var maxId = Math.max.apply(null, _.pluck(dataset.entries, 'id'));
var lastEntry = _.filter(dataset.entries, function (e) {
    return e.id === maxId;
})[0];

describe('REST api', function () {
    before(function() {
        data.setName('dbtest');
        data.setData1([[1, 9, 3], [4, 3, 7], [6, 2, 6], [1, 1, 1], [2, 3, 4], [9, 7, 4], [1, 4, 3]]);
        data.setData2([[6, 4, 7], [0, 8, 5]]);
    });

    beforeEach(function () {
        return data.saveFast();
    });

    afterEach(function () {
        return data.drop();
    });

    var agent = request.agent(app);
    it('should get entries', function (done) {
        agent.get('/database/dbtest')
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(200, dataset.filteredEntries, done);
    });

    it('should get entries with a limit', function (done) {
        agent.get('/database/dbtest?limit=2')
            .expect('Content-Type', /json/)
            .expect(200, dataset.filteredEntries.slice(0, 2), done);
    });

    it('should save entries', function (done) {
        agent.put('/database/dbtest')
            .send({
                epoch: new Date('2001-01-01').getTime() / 1000 | 0,
                parameters: {
                    A: 3,
                    B: 8,
                    C: 2
                }
            })
            .expect('Content-Type', /json/)
            .expect(200, {ok: true}, function () {
                data.getEntries().then(function (data) {
                    var d = data[0];
                    delete d.timestamp;
                    d.should.eql({
                        epoch: 978307200,
                        id: 10,
                        A: 3,
                        B: 8,
                        C: 2
                    });
                    return done();
                }).catch(function (err) {
                    done(err);
                });
            });
    });

    it('should return the last element', function (done) {
        agent.get('/database/last/' + data.name)
            .expect('Content-Type', /json/)
            .end(function (err, res) {
                if (err) done(err);
                var r = res.body;
                delete r.timestamp;
                r.should.eql(lastEntry);
                return done();
            })
    });
});