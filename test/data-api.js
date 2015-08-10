'use strict';

var request = require('supertest');
var bootstrap = require('./bootstrap/data-api-bootstrap');
var app = bootstrap.app;
var config = bootstrap.config;

app.get('/user', function(req, res){
    res.send(200, { name: 'tobi' });
});

describe('save', function() {
    var agent = request.agent(app);
    it('should save', function(done) {
        agent.get('/user')
            .expect('Content-Type', /json/)
            .expect('Content-Length', '15')
            .expect(200, done);
    });
});