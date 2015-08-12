'use strict';

var request = require('supertest');
var app = require('./bootstrap/data-api-bootstrap');
var data = require('./data');
var dataset = require('./dataset.json');

app.get('/user', function(req, res){
    res.send(200, { name: 'tobi' });
});

describe('REST api', function() {
    beforeEach(function() {
        return data.drop().then(data.saveFast);
    });

    after(function() {
        return data.drop();
    });

    var agent = request.agent(app);
    it('should get entries', function(done) {
        agent.get('/database/dbtest')
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(200, dataset.filteredEntries, done);
    });

    it('should get entries with a limit', function(done) {
        agent.get('/database/dbtest?limit=2')
            .expect('Content-Type', /json/)
            .expect(200, dataset.filteredEntries.slice(0,2), done);
    });

    it('should save entries', function(done) {
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
        .expect(200, {ok: true}, function() {
                data.getEntries().then(function(data) {
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
                }).catch(function(err) {
                    done(err);
                })
            });
    })
});