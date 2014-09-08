exports.validateParameters = function (params) {
    if (!(params instanceof Array))
        params = [params];

    return function(req, res, next) {
        var validParameters = {};

        for (var i = 0; i < params.length; i++) {

            var param = params[i];

            var paramName = (typeof param === 'object') ? param.name : param;

            var value = req.params[paramName] || req.query[paramName] || (req.body ? req.body[paramName] : null);

            if (!value) {
                return res.status(400).json('required parameter: ' + paramName);
            }

            if (param.type) {
                switch (param.type) {
                    case 'enum':
                        var enums = param.possible || [];
                        if(enums.indexOf(value) === -1) {
                            return res.status(400).json('parameter ' + paramName + ' must be on of the following: [' + enums.join(', ') + ']');
                        }
                        break;
                    case 'device':
                        var regexp = /\$[A-Z]/;
                        if(!value.match(regexp)) {
                            return res.status(400).json('parameter '+ paramName + ' must match regular expression: ', regexp.toString());
                        }
                }
            }

            validParameters[paramName] = value;
        }

        res.locals.parameters = validParameters;
        next()
    };
};