var router = require('express').Router(),
    middleware = require('../middleware/common'),
    fs = require('fs'),
    path = require('path');

exports  = module.exports = router;


router.get('/list', middleware.validateParameters({ name: 'dir', required: false}), function(req, res){
    var dir = './static/views';
    if(res.locals.parameters.dir) {
        if(res.locals.parameters.dir.indexOf('..') > -1) {
            return res.status(400).json();
        }
        dir = path.join(dir, res.locals.parameters.dir);
    }
    var list = getDirectories(dir, res.locals.parameters.dir);
    if(!list) {
        return res.status(404).json();
    }
    list.map(function(el) {
        el.rel = res.locals.parameters.dir ? path.normalize(res.locals.parameters.dir) + '/' :  './';
        return el;
    });
    return res.status(200).json(list);
});

function getDirectories(dir, relDir) {
    try{
        console.log(dir, relDir);
        return fs.readdirSync(dir).filter(function(file) {
            return file[0] !== '.';
        }).map(function (file) {
            return {
                name: file,
                isDir: fs.statSync(path.join(dir, file)).isDirectory(),
                rel: dir,
                url: path.join('/views/', relDir || '', file)
            };
        });
    }
    catch(err) {
        console.log(err);
        return null;
    }
}