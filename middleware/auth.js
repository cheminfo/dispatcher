'use strict';

var debug = require('debug')('auth-middleware');
var config = require('../configs/config');

exports = module.exports = {};

exports.simple = function simple(req, res, next) {
    var auth = req.params.auth || req.query.auth || (req.body ? req.body.auth : null);
    if(!auth) return res.json(401);

    var appconfig = config.getAppconfig();
    if(appconfig.authKey !== auth) {
        debug('Not passing authentification');
        return res.status(401);
    }

    return next();
};
