'use strict';
var util = require('../util/util');
describe('test utility functions', function() {
     it('should convert id string to id number', function() {
         util.deviceIdStringToNumber('$J').should.be.eql(9290);
         util.deviceIdStringToNumber('#1').should.be.eql(9009);
         util.deviceIdStringToNumber('dbtest').should.be.eql('dbtest');
         (util.deviceIdStringToNumber() === undefined).should.be.true;
     });

    it('should convert id number to id string', function() {
        util.deviceIdNumberToString(9290).should.be.eql('$J');
        util.deviceIdNumberToString(9009).should.be.eql('#1');

    });
});