var _ = require('lodash');

exports.validateParameters = function (params) {
    if (!(params instanceof Array))
        params = [params];

    return function(req, res, next) {
        var validParameters = {};
        for (var i = 0; i < params.length; i++) {

            var param = params[i];
            if(param.required === undefined) param.required = true;
            var paramName = (typeof param === 'object') ? param.name : param;

            var value = req.params[paramName] || req.query[paramName] || (req.body ? req.body[paramName] : null);
            if (!value && param.required) {
                return res.status(400).json('required parameter: ' + paramName);
            }

            if (param.type && value) {
                switch (param.type) {
                    case 'enum':
                        var enums = param.possible || [];
                        if(enums.indexOf(value) === -1) {
                            return res.status(400).json('parameter ' + paramName + ' must be on of the following: [' + enums.join(', ') + ']');
                        }
                        break;
                    case 'device':
                        var regexp = /^.{2}$/;
                        if(!value.match(regexp)) {
                            return res.status(400).json('parameter '+ paramName + ' must match regular expression: ', regexp.toString());
                        }
                        break;
                    case 'filter':
                        var Filter = require('../lib/filter');
                        var filter = new Filter();
                        if(!filter[value]) {
                            return res.status(400).json('the filter ' + value + ' does not exist');
                        }
                }
            }

            validParameters[paramName] = value;
        }
        res.locals.parameters = _.merge(res.locals.parameters || {}, validParameters);
        next();
    };
};