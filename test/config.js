'use strict';

var config = require('../configs/config');
var _ = require('lodash');

config.addConfiguration('test/dbtest');

describe.only('Configuration', function() {
    it('Should return empty set of devices', function() {
        var devices = config.findDevicesByGroup('agroup');
        devices.should.be.instanceOf(Array);
        devices.should.have.length(0);
    });

    it('Should have groups', function() {
        config.addConfiguration('test/hasgroups');
        var devices = config.findDevicesByGroup('group1');
        devices.should.be.instanceOf(Array);
        devices.should.have.length(2);

        devices = config.findDevicesByGroup('group2');
        devices.should.be.instanceOf(Array);
        devices.should.have.length(1);
    });

    it('Should merge device config', function() {
        config.addConfiguration('test/needsMerge');
        var device = config.findDeviceById('needsMerge');
        device.parameters.A.custom.should.equal('custom');
        device.parameters.A.name.should.equal('temperature');
    });
});