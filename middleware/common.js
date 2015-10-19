'use strict';

var _ = require('lodash');
var debug = require('debug')('middleware');
var config = require('../configs/config');
var util = require('../util/util');

exports.validateParameters = function (params) {
    if (!(params instanceof Array))
        params = [params];

    return function (req, res, next) {
        var validParameters = {};
        for (var i = 0; i < params.length; i++) {

            var param = params[i];
            if (param.required === undefined) param.required = true;
            var paramName = (typeof param === 'object') ? param.name : param;

            var value = req.params[paramName] || req.query[paramName] || (req.body ? req.body[paramName] : null);
            if (!value && param.required) {
                debug(paramName + ' is required');
                return res.status(400).json('required parameter: ' + paramName);
            }

            if (param.name && value) {
                switch (param.name) {
                    case 'enum':
                        var enums = param.possible || [];
                        if (enums.indexOf(value) === -1) {
                            debug(paramName + ' did not pass enum validation');
                            return res.status(400).json('parameter ' + paramName + ' must be on of the following: [' + enums.join(', ') + ']');
                        }
                        break;
                    case 'device':
                        // can be anything but should not contain dots or slashes
                        var regexp = /^[^\.\/]+$/;
                        if (!value.match(regexp)) {
                            debug(paramName + ' did not pass device validation');
                            return res.status(400).json('parameter ' + paramName + ' is not valid');
                        }
                        break;
                }
            }

            validParameters[paramName] = value;
        }
        res.locals.parameters = _.merge(res.locals.parameters || {}, validParameters);
        next();
    };
};

exports.checkDevice = function (req, res, next) {
    var deviceId = res.locals.parameters.device;
    var device = config.findPluggedDevice(deviceId);
    res.locals.deviceId = deviceId;
    res.locals.device = device;
    next();
};

exports.noop = function(req, res, next) {
    return next();
};