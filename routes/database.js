var router = require('express').Router(),
    middleware = require('../middleware/common'),
    util = require('../util/util'),
    filter = require('../');

exports  = module.exports = router;

var queryValidator = [
    {name: 'fields', required: false},
    {name: 'device', required: true},
    {name: 'limit', required: false},
    {name: 'mean', required: false}
];

app.get('/:device', middleware.validateParameters(_.flatten([queryValidator, {name:'filter', required: false}])), function(req, res) {
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


    database.get(deviceId, options).then(function(result) {
        switch(res.locals.parameters.filter) {
            case 'chart':
                var chart = filter.chartFromDatabaseEntries(result, res.locals.parameters.device);
                return res.status(200).json(chart);
            default:
                var data = filter.normalizeData(result, res.locals.parameters.device);
                return res.status(200).json(data);
        }

    }).catch(function(err) {
        return res.status(400).json('Database error');
    });
});
