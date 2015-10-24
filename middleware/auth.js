'use strict';

var debug = require('debug')('auth-middleware');
var config = require('../configs/config');

exports = module.exports = {};

exports.simple = function simple(req, res, next) {
    var auth = req.params.auth || req.query.auth || (req.body ? req.body.auth : null);
    if(!auth) {
        debug('Not passing authentification (no auth given)');
        return res.status(401).json("Unauthorized");
    }

    var appconfig = config.getAppconfig();
    if(appconfig.authKey !== auth) {
        debug('Not passing authentification');
        return res.status(401).json("Unauthorized");
    }

    return next();
};
