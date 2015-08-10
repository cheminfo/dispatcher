'use strict';

var request = require('supertest');
var app = require('./bootstrap/data-api-bootstrap');


app.get('/user', function(req, res){
    res.send(200, { name: 'tobi' });
});

describe('save', function() {
    var agent = request.agent(app);
    it('should save', function(done) {
        agent.get('/user')
            .expect('Content-Type', /json/)
            .expect('Content-Length', '20')
            .expect(200, done);
    });
});