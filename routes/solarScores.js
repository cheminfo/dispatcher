'use strict';

var router = require('express').Router(),
    middleware = require('../middleware/common'),
    util = require('../util/util'),
    scores = require('../lib/solarScores');

exports = module.exports = router;

router.get('/all/:group', middleware.validateParameters({
   name: 'group', required: true
}),  function(req, res) {
    var group = res.locals.parameters.group;
    scores.allFromGroup(group).then(function(result) {
        console.log('success', result);
        return res.status(200).json(result);
    }).catch(function(e) {
        console.error('All group scores failed');
        return res.status(500).json(e.message);
    });
});