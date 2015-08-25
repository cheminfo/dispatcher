'use strict';

var router = require('express').Router(),
    config = require('../configs/config'),
    cmdArgs = require('../util/cmdArgs');

exports = module.exports = router;

// The root element redirects to the default visualizer view
router.get('/', function (req, res) {
    var defaultView = cmdArgs('view', 'dispatcher');
    var useLactame = cmdArgs('useLactame', false);
    res.set({
        'Cache-Control': 'no-cache'
    });
    var df = defaultView || 'dispatcher';
    var view;
    if (useLactame) {
        view = '/visualizer_lactame/index.html?config=/config/default.json&viewURL=/views/' + df + '.json&dataURL=/data/default.json';
    }
    else {
        view = '/visualizer/index.html?config=/config/default.json&viewURL=/views/' + df + '.json&dataURL=/data/default.json';
    }

    res.redirect(301, view);
});