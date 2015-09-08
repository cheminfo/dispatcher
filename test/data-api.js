/*
    Test the data rest api
 */

'use strict';

var request = require('supertest');
var server = require('../server/server');
var data = require('./database/data');
var dataset = require('./database/normal/dataset.json');
var config = require('../configs/config');
var _ = require('lodash');

config.addConfiguration('dbtest');
server.mountModules('database');
var app = server.getExpress();
var moment = require('moment');

var maxId = Math.max.apply(null, _.pluck(dataset.entries, 'id'));
var lastEntry = _.filter(dataset.entries, function (e) {
    return e.id === maxId;
})[0];

var bTime = '1999-12-31T19:00:00.0-0500';

describe('REST api', function () {
    before(function() {
        data.setName('$Z');
        data.clearData();
        data.addData([
            {data: [1, 9, 3], time: bTime},
            {data: [4, 3, 7], time: bTime},
            {data: [6, 2, 6], time: moment(bTime).add(1, 'minute')},
            {data: [1, 1, 1], time: moment(bTime).add(1, 'minute')},
            {data: [2, 3, 4], time: moment(bTime).add(1, 'hour')},
            {data: [9, 7, 4], time: moment(bTime).add(1, 'hour')},
            {data: [1, 4, 3], time: moment(bTime).add(1, 'day')}
        ]);
        data.addData([
            {data: [6, 4, 7], time: bTime},
            {data: [0, 8, 5], time: bTime}
        ]);
        return data.drop();
    });

    beforeEach(function () {
        return data.saveFast();
    });

    afterEach(function () {
        return data.drop();
    });

    var agent = request.agent(app);
    it('should get entries', function (done) {
        agent.get('/database/' + data.name)
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(200, dataset.filteredEntries, done);
    });

    it('should get entries with a limit', function (done) {
        agent.get('/database/' + data.name + '?limit=2')
            .expect('Content-Type', /json/)
            .expect(200, dataset.filteredEntries.slice(0, 2), done);
    });

    it('should save entries', function (done) {
        agent.put('/database/' + data.name)
            .send({
                epoch: new Date('2001-01-01').getTime() / 1000 | 0,
                parameters: {
                    A: 3,
                    B: 8,
                    C: 2
                }
            })
            .expect('Content-Type', /json/)
            .expect(200, {ok: true}, function (err) {
                if(err) return done(err);
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
            .expect(200, function (err, res) {
                if (err) done(err);
                var r = res.body;
                delete r.timestamp;
                r.should.eql(lastEntry);
                return done();
            });
    });
});