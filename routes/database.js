var router = require('express').Router(),
    middleware = require('../middleware/common'),
    util = require('../util/util'),
    Filter = require('../lib/filter'),
    database = require('../db/database'),
    config = require('../configs/config');
_ = require('lodash');

exports = module.exports = router;
var filter = new Filter();

var queryValidator = [
    {name: 'fields', required: false},
    {name: 'device', required: true},
    {name: 'limit', required: false},
    {name: 'mean', required: false}
];

router.get('/:device', middleware.validateParameters(_.flatten([queryValidator, {
    name: 'filter',
    required: false
}])), function (req, res) {
    var deviceId = util.deviceIdStringToNumber(res.locals.parameters.device);
    var fields = res.locals.parameters.fields || '*';
    var mean = res.locals.parameters.mean || 'entry';
    var limit = res.locals.parameters.limit || 10;
    fields = fields.split(',');
    var options = {
        limit: limit,
        fields: fields,
        mean: mean
    };
    database.get(deviceId, options).then(function (result) {
        switch (res.locals.parameters.filter) {
            case 'chart':
                var chart = filter.chartFromDatabaseEntries(result, res.locals.parameters.device);
                return res.status(200).json(chart);
            default:
                var data = filter.normalizeData(result, res.locals.parameters.device);
                return res.status(200).json(data);
        }

    }).catch(function (err) {
        return res.status(400).json('Database error');
    });
});

router.put('/:device',
    middleware.validateParameters(queryValidator),
    middleware.checkDevice,
    function (req, res) {


    var entry = req.body;
    if (Array.isArray(entry)) {
        entry.forEach(function (e) {
            e.deviceId = res.locals.deviceId;
        });
    } else {
        entry.deviceId = res.locals.deviceId;
    }

    entry = filter.deepenEntries(entry);
    database.save(entry, res.locals.device.sqlite).then(function () {
        return res.status(200).json({ok: true});
    }).catch(function () {
        return res.status(400).json('Database error')
    });
});

router.get('/last/:device',
    middleware.validateParameters(queryValidator),
    middleware.checkDevice,
    function (req, res) {
        database.last(res.locals.deviceId).then(function(data) {
            return res.status(200).json(data);
        }).catch(function(err) {
            if(err.errno === 1) return res.status(404).json('not found');
            return res.status(400).json('Database error');
        });
    }
);
