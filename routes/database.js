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
    {name: 'device', required: true},
    {name: 'limit', required: false},
    {name: 'mean', required: false}
];

var authM = config.getAppconfig().authKey ? authMiddleware.simple : middleware.noop;

router.get('/:device', middleware.validateParameters(queryValidator), function (req, res) {
    var deviceId = res.locals.parameters.device;
    var options = (res.locals.device && res.locals.device.sqlite) || {};
    options.fields = res.locals.parameters.fields || '*';
    options.mean = res.locals.parameters.mean || 'entry';
    options.limit = res.locals.parameters.limit || 10;
    options.fields = options.fields.split(',');

    database.get(deviceId, options).then(function (result) {
        switch (res.locals.parameters.filter) {
            case 'chart':
                var chart = filter.chartFromDatabaseEntries(result, deviceId);
                return res.status(200).json(chart);
            default:
                var data = filter.normalizeData(result, deviceId);
                return res.status(200).json(data);
        }

    }).catch(function (err) {
        debug('database, filter error (get entries): ' + err);
        return res.status(400).json(err.message);
    });
});

router.put('/:device',
    authM,
    middleware.validateParameters(queryValidator),
    middleware.checkDevice,
    function (req, res) {
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
    });

router.get('/last/:device',
    middleware.validateParameters(queryValidator),
    middleware.checkDevice,
    function (req, res) {
        var options = (res.locals.device && res.locals.device.sqlite) || {};
        database.last(res.locals.parameters.device, options).then(function (data) {
            return res.status(200).json(data);
        }).catch(function (err) {
            debug('database error (get last): ' + err);
            if (err.errno === 1) return res.status(404).json('not found');
            return res.status(400).json(err.message);
        });
    }
);
