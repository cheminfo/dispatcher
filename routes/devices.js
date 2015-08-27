'use strict';

var router = require('express').Router(),
    deviceManager = require('../devices/manager'),
    middleware = require('../middleware/common'),
    config = require('../configs/config'),
    _ = require('lodash'),
    Filter = require('../lib/filter');



exports = module.exports = router;

// Middleware
var validateFilter = middleware.validateParameters({type: 'filter', name: 'filter'});
var validateDevice = middleware.validateParameters({type: 'device', name: 'device'});

router.get('/restart', function (req, res) {
    deviceManager.restart().then(function () {
        return res.status(200).json({ok: true});
    }, function (err) {
        return res.status(500).json({ok: false, message: err});
    });
});

router.get('/status', function (req, res) {
    return res.json(deviceManager.cachesHash[device].data.status);
});

router.get('/status/:device',
    validateDevice,
    function (req, res) {
        // get parameter from cache
        var device = res.locals.parameters.device;
        return res.json(deviceManager.cachesHash[device].data.status[device]);
    });

router.get('/param/:device/:param',
    middleware.validateParameters([{name: 'device', type: 'device'}, {name: 'param'}]),
    function (req, res) {
        var device = res.locals.parameters.device;
        var param = res.locals.parameters.param;
        return res.json(deviceManager.cachesHash[device].data.param[device][param]);
    }
);

router.get('/param/:device',
    validateDevice,
    function (req, res) {
        var device = res.locals.parameters.device;
        return res.json(deviceManager.cachesHash[device].data.param[device]);
    }
);

router.get('/all/:filter', validateFilter, function (req, res) {
    // visualizer filter converts object to an array
    // for easy display in a table
    //var entry = deviceManager.cachesHash[device].get('entry');
    var entry = {}, status = {};
    var filter = new Filter();
    for (var i = 0; i < deviceManager.caches.length; i++) {
        entry = _.merge(entry, filter[res.locals.parameters.filter](deviceManager.caches[i].get('entry')));
        status = _.merge(status, deviceManager.caches[i].get('status'));
    }
    var all = {
        config: config.getMergedDevices(),
        entry: entry,
        status: status
    };

    res.json(all);
});

router.get('/save',
    middleware.validateParameters([{name: 'device'}, {name: 'param'}, {name: 'value'}]),
    function (req, res) {
        var deviceId = res.locals.parameters.device;
        var reqManager = deviceManager.serialManagersHash[deviceId];
        var pluggedDevice = config.findPluggedDevice(deviceId);
        var prefix = pluggedDevice.findDeviceById(deviceId).prefix;
        var cmd = prefix + res.locals.parameters.param + res.locals.parameters.value;
        reqManager.addRequest(cmd).then(function () {
            return res.json({ok: true});
        }, function () {
            return res.status(500, {ok: false});
        });
    });

router.get('/command/:device/:command',
    middleware.validateParameters([{name: 'device', type: 'device'}, {name: 'command'}]),
    function (req, res) {
        var idx = _.findIndex(characters, {'id': res.locals.parameters.device});
        var prefix = devices[idx].prefix;
        serialManager.addRequest(prefix + res.locals.parameters.command).then(function (entries) {
            return res.json(entries);
        }, function () {
            return res.status(500);
        });
    });

router.post('/command',
    middleware.validateParameters([{name: 'command', required: true}, {name: 'device', required: true}]),
    function (req, res) {
        var deviceId = res.locals.parameters.device;
        var pluggedDevice = config.findPluggedDevice(deviceId);
        var prefix = pluggedDevice.findDeviceById(deviceId).prefix;
        if (!deviceId) {
            return res.status(400);
        }

        var cmd = res.locals.parameters.command;
        var reqManager = deviceManager.serialManagersHash[deviceId];
        if(!reqManager) {
            console.log('hello', deviceManager.serialManagersHash);
            return res.status(400).json({});
        }
        reqManager.addRequest(prefix + cmd).then(function (result) {
            return res.send(result);
        }, function () {
            return res.status(500);
        });
    });
