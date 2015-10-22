'use strict';

var config = require('../configs/config');
var Filter = require('../lib/filter');

config.addConfiguration('test/dbtest');
var filter = new Filter();

describe('Filter functions', function () {
    it('should flatten deep entries', function () {
        var f = filter.flattenEntries(deep);
        f.should.eql(flat);
    });

    it('should deepen flat entries', function () {
        var d = filter.deepenEntries(flat);
        d.should.eql(deep);
    });

    it('should deepen semi-flat entries', function () {
        var d = filter.deepenEntries(semiFlat);
        d.should.eql(deep);
    });

    it('should flatten semi-flat entries', function () {
        var f = filter.flattenEntries(semiFlat);
        f.should.eql(flat);
    });

    it('should flatten entry (not an array)', function () {
        var f = filter.flattenEntries(deep[0]);
        f.should.eql(flat[0]);
    });

    it('should deepen entry (not an array)', function () {
        var d = filter.deepenEntries(flat[0]);
        d.should.eql(deep[0]);
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