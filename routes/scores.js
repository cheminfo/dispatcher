'use strict';

var router = require('express').Router(),
    middleware = require('../middleware/common'),
    util = require('../util/util'),
    scores = require('../lib/scores'),
    config = require('../configs/config'),
    solarScores = require('solar-scores'),
    _ = require('lodash'),
    database = require('../db/database');

exports = module.exports = router;

router.get('/device/:device',
    middleware.validateParameters([
        {name: 'device', required: true},
        {name: 'as', required: false}
    ]), function (req, res) {
        var deviceId = res.locals.parameters.device;
        scores.all(deviceId).then(function (data) {
            console.log(data);
            data.name = deviceId;
            if (res.locals.parameters.as === 'html') {
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
            res.status(400).json("Bad request");
        });

    }
);

router.get('/report/:casaid', middleware.validateParameters({
    name: 'casaid', required: true
}), function(req, res) {
    var result = scores.randomReport(res.locals.parameters.casaid);
    return res.status(200).json(result);
});

//router.get('/group/:group', middleware.validateParameters({
//    name: 'group', required: false
//}), function(req, res) {
//    var params = config.getParamsInGroup(res.locals.parameters.group);
//    params = params.filter(function(param) {
//        return param.scoreMethod;
//    });
//
//    params = _.groupBy(params, function (param) {
//        return param.scoreMethod;
//    });
//
//    var result = {};
//
//
//    for(let key in params) {
//        switch(key) {
//            case 'temperature':
//                break;
//            case 'freezer':
//
//                break;
//            case 'humidity':
//                try {
//                    var data = database.get(params[key].deviceId);
//                    var score = new solarScores.Humidity({
//                        maxHumidity: 60,
//                        tolerance: 10
//                    });
//                    score.addInternal(data);
//                    result.humidity = score.getScore();
//
//                } catch(e) {
//                    console.log( e.message, e.stack);
//                    result.humidity = 'NA'
//                }
//
//
//                break;
//            case 'luminosity':
//                break;
//            case 'refrigerator':
//                break;
//            case 'consumedEnergy':
//                break;
//            case 'producedEnergy':
//                break;
//
//        }
//    }
//    console.log(params);
//
//    res.status(200).json(params);
//});

