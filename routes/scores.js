'use strict';

var router = require('express').Router(),
    middleware = require('../middleware/common'),
    util = require('../util/util'),
    scores = require('../lib/scores'),
    config = require('../configs/config');

exports = module.exports = router;

router.get('/device/:device', middleware.validateParameters({name: 'device', required: true}), function (req, res) {
    var deviceId = res.locals.parameters.device;
    scores.all(deviceId).then(function (data) {
        console.log(data);
        data.name = deviceId;
        res.render('scores/scores', {teams: [data]});
    })
});

router.get('/all', function (req, res) {
    var devices = config.getMergedDevices();
    var prom = new Array(devices.length);
    for (var i = 0; i < devices.length; i++) {
        prom[i] = scores.all(devices[i].id);
    }
    Promise.all(prom).then(function(data) {
        for (var i = 0; i < data.length; i++) {
            data[i].name = devices[i].id;
        }
        res.render('scores/scores',{teams: data});
    }, function() {
        res.status(400);
    });
});