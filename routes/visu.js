"use strict";

var router = require('express').Router(),
    middleware = require('../middleware/common'),
    fs = require('fs-extra'),
    path = require('path'),
    debug = require('debug')('visualizer-routes');

exports  = module.exports = router;


router.get('/configs', function(req, res) {
    debug('configs');
    // Get all files in configs
    var dir = 'configs';
    var files = getFiles(dir);
    if(!files) {
        return res.json(400).json({});
    }
    files = files.filter(function(file) {
        return file.indexOf('.json') > -1;
    });

    var result = [];
    for(var i=0; i<files.length; i++) {
        result.push({
            name: files[i],
            value: {
                type: 'object',
                url: path.join('/',dir, files[i])
            }
        });
    }

    return res.status(200).json(result);
});

function getFiles(dir) {
    try {
        return fs.readdirSync(dir).filter(function(file) {
            return !fs.statSync(path.join(dir, file)).isDirectory();
        });
    } catch(err) {
        return null;
    }

}
