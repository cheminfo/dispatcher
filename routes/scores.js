'use strict';

var router = require('express').Router(),
    middleware = require('../middleware/common'),
    util = require('../util/util'),
    scores = require('../lib/scores'),
    config = require('../configs/config');

exports = module.exports = router;

router.get('/device/:device',
    middleware.validateParameters([
        { name: 'device', required: true },
        { name: 'as', required: false }
    ]), function (req, res) {
    var deviceId = res.locals.parameters.device;
    scores.all(deviceId).then(function (data) {
        console.log(data);
        data.name = deviceId;
        if(res.locals.parameters.as === 'html') {
            return res.render('scores/scores', {teams: [data]});
        }
        return res.json(data);
    })
});

router.get('/all', middleware.validateParameters({name: 'as'}), function (req, res) {
    var devices = config.getMergedDevices();
    var prom = new Array(devices.length);
    for (var i = 0; i < devices.length; i++) {
        prom[i] = scores.all(devices[i].id);
    }
    Promise.all(prom).then(function (data) {
        for (var i = 0; i < data.length; i++) {
            data[i].name = devices[i].id;
        }
        if (res.locals.parameters.as === 'html') {
            return res.render('scores/scores', {teams: data});
        }
        return res.json(data);
    }, function () {
        res.status(400);
    });
});

router.get('/param/:type/:device/:param', middleware.validateParameters({
        name: 'device', required: true
    }),
    function (req, res) {
        Promise.resolve().then(function () {
            return scores[req.params.type](res.locals.parameters.device, req.params.param).then(function (score) {
                res.json({
                    points: score,
                    availablePoints: scores.maxPoints(req.params.type)
                });
            });
        }).catch(function () {
            res.status(400);
        });

    }
);

