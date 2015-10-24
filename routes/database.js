'use strict';

var router = require('express').Router(),
    middleware = require('../middleware/common'),
    authMiddleware = require('../middleware/auth'),
    util = require('../util/util'),
    Filter = require('../lib/filter'),
    database = require('../db/database'),
    config = require('../configs/config'),
    _ = require('lodash'),
    debug = require('debug')('router:database');

exports = module.exports = router;
var filter = new Filter();

var queryValidator = [
    {name: 'fields', required: false},
    {name: 'limit', required: false},
    {name: 'mean', required: false}
];

var deviceQueryValidator = _.flatten([queryValidator, {name: 'device', required: true}]);

var authM = config.getAppconfig().authKey ? authMiddleware.simple : middleware.noop;

function databaseOptions(res, options) {
    options.fields = res.locals.parameters.fields || '*';
    options.mean = res.locals.parameters.mean || 'entry';
    options.limit = res.locals.parameters.limit || 10;
    options.fields = options.fields.split(',');
}

function filterResult(res, result, deviceId) {
    switch (res.locals.parameters.filter) {
        case 'chart':
            return filter.chartFromDatabaseEntries(result, deviceId);
        default:
            return filter.normalizeData(result, deviceId);
    }
}

router.get('/:device', middleware.validateParameters(
    _.flatten([
        deviceQueryValidator,
        {name: 'filter', required: false}
    ])), function (req, res) {
    var deviceId = res.locals.parameters.device;
    var options = (res.locals.device && res.locals.device.sqlite) || {};
    databaseOptions(res, options);

    database.get(deviceId, options).then(function (result) {
        var data = filterResult(res, result, deviceId);
        return res.status(200).json(data);
    }).catch(function (err) {
        debug('database, filter error (get entries): ' + err);
        return res.status(400).json(err.message);
    });
});

router.get('/group/:group', middleware.validateParameters(
    _.flatten([
        queryValidator,
        {name: 'filter', required: false},
        {name: 'group', required: true}
    ])), function (req, res) {
    var devices = config.findDevicesByGroup(res.locals.parameters.group);
    var prom = [];
    for (let i = 0; i < devices.length; i++) {
        let options = (res.locals.device && res.locals.device.sqlite) || {};
        databaseOptions(res, options);
        var p = database.get(devices[i].id, options).then(function (result) {
            return filterResult(res, result, devices[i].id);
        });
        prom.push(p);
    }

    Promise.all(prom).then(function (results) {
        var data = {
            group: res.locals.parameters.group,
            devices: new Array(results.length)
        };
        for (let i = 0; i < results.length; i++) {
            data.devices[i] = {
                meta: devices[i],
                data: results[i]
            }
        }
        return res.status(200).json(data);
    }).catch(function (e) {
        return res.status(400).json(e.message);
    });
});

router.put('/:device',
    authM,
    middleware.validateParameters(deviceQueryValidator),
    middleware.checkDevice,
    function (req, res) {
        try {
            var options = (res.locals.device && res.locals.device.sqlite) || {};
            var entry = req.body;
            if (Array.isArray(entry)) {
                entry.forEach(function (e) {
                    e.deviceId = res.locals.deviceId;
                });
            } else {
                entry.deviceId = res.locals.deviceId;
            }

            entry = filter.deepenEntries(entry);
            database.save(entry, options).then(function () {
                return res.status(200).json({ok: true});
            }).catch(function (err) {
                debug('database error (save)', err);
                return res.status(400).json(err.message)
            });
        } catch(e) {
            debug('Unexpected error', e);
            return res.status(500).json({error: 'Unexpected error'});
        }

    });

router.get('/last/:device',
    middleware.validateParameters(deviceQueryValidator),
    middleware.checkDevice,
    function (req, res) {
        var options = (res.locals.device && res.locals.device.sqlite) || {};
        database.last(res.locals.parameters.device, options).then(function (data) {
            return res.status(200).json(data);
        }).catch(function (err) {
            debug('database error (get last): ' + err);
            if (err.errno === 1 || err.message === 'Database does not exist') return res.status(404).json('not found');
            return res.status(400).json(err.message);
        });
    }
);
