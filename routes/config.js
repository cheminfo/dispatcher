"use strict";

var router = require('express').Router(),
    debug = require('debug')('config-routes'),
    middleware = require('../middleware/common'),
    path = require('path'),
    _ = require('lodash'),
    fs = require('fs-extra');

exports = module.exports = router;


router.get('/appconfig', function (req, res) {
    // Create it if it does not exist
    if (!fs.existsSync('./appconfig.json')) {
        fs.copy('./default.json', './appconfig.json', function (err) {
            if (err) return res.status(500).json({});
            return res.status(200).json(fs.readJsonSync('./appconfig.json'));
        })
    }
    else {
        return res.status(200).json(fs.readJsonSync('./appconfig.json'));
    }
});

router.post('/save/device', middleware.validateParameters([
    {name: 'name', required: false},
    {name: 'content'},
    {name: 'defaultName', required: false}
]), save('devices'));


router.post('/save/config', middleware.validateParameters([
    {name: 'name', required: false},
    {name: 'content'},
    {name: 'defaultName', required: false}
]), save('configs'));

router.post('/save/appconfig',
    middleware.validateParameters({
        name: 'content'
    }), function (req, res) {
        var content = res.locals.parameters.content;

        if (!content || _.isEmpty(content)) {
            return res.status(400).json({});
        }

        fs.writeJson('./appconfig.json', content, function (err) {
            if (err) {
                return res.status(500).json({});
            }
            return res.status(200).json({});
        });
    }
);

function save(dir) {
    return function (req, res) {
        console.log('save...');
        var name = res.locals.parameters.name;
        var content = res.locals.parameters.content;
        var defaultName = res.locals.parameters.defaultName;

        if (!name && !defaultName) {
            return res.status(400).json('Either name or defaultName must be defined');
        }

        if (_.isEmpty(content) && defaultName) {
            return res.status(400).json('Content is empty');
        }

        if (!name || _.isEmpty(name)) {
            name = defaultName;
        }

        var filePath = path.join(dir, name);

        console.log('Write json');
        fs.writeJson(filePath, content, function (err) {
            if (err) return res.status(500).json('Could not write json file');
            return res.status(200).json({});
        });
    }
}