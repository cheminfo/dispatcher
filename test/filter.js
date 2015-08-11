'use strict';

var config = require('../configs/config');
var Filter = require('../lib/filter');

config.addConfiguration('dbtest');
var filter = new Filter();

describe('Filter functions', function() {
    it('should flatten a deep entry', function() {
        var f = filter.flattenEntries(deep);
        f.should.eql(flat);
    });

    it('should deepen a flat enty', function() {
        var d = filter.deepenEntries(flat);
        d.should.eql(deep);
    });

    it('should deepen a semi-flat entry', function() {
        var d = filter.deepenEntries(semiFlat);
        d.should.eql(deep);
    });

    it('should flatten a semi-flat entry', function() {
        var f = filter.flattenEntries(semiFlat);
        f.should.eql(flat);
    });
});

var flat = [{
    id: 1,
    epoch: 0,
    A: 1,
    B: 2
}];

var deep = [{
    id: 1,
    epoch: 0,
    parameters: {
        A: 1,
        B: 2
    }
}];

var semiFlat = [{
    id: 1,
    epoch: 0,
    A: 1,
    parameters: {
        B: 2
    }
}];