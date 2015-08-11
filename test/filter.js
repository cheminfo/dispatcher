'use strict';

var config = require('../configs/config');
var Filter = require('../lib/filter');

config.addConfiguration('dbtest');
var filter = new Filter();

describe('Filter functions', function() {
    it('should flatten entries', function() {
        var f = filter.flattenEntries(deep);
        f.should.eql(flat);
    });

    it('should deepen entries', function() {
        var d = filter.deepenEntries(flat);
        d.should.eql(deep);
    })
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