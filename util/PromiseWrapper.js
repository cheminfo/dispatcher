var Promise = require('bluebird'),
    debug = require('debug')('PromiseWrapper');


exports = module.exports = function(wrappedObj, wrappedFn) {
    this.wrappedObj = wrappedObj;
    this.wrappedFn = wrappedFn;

    var that = this;
    for(var i=0; i<this.wrappedFn.length; i++) {
        (function(i) {
            that[wrappedFn[i]] = function() {
                var args = arguments;
                return new Promise(function(resolve, reject) {
                    debug(args);
                    var callback = function(err, res) {
                        if(err) {
                            return reject(err);
                        }
                        else {
                            return resolve(res);
                        }
                    };
                    [].push.apply(args, [callback]);
                    that.wrappedObj[that.wrappedFn[i]].apply(that.wrappedObj, args);
                });
            }
        })(i);
    }
};

