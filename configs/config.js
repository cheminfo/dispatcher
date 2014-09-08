var _ = require('lodash'),
    debug = require('debug')('config'),
    path = require('path'),
    fs = require('fs');

exports = module.exports = {
    getConfig: function(name) {
        var def = require('./default.json');
        var conf = require('./'+name+'.json');

        _.defaults(conf, def);
        processConf(conf);
        if(checkConfig(conf)) {
            return conf;
        }
        else {
            throw new Error('Bad config file')
        }
    }
};

function checkConfig(config) {
    return !!config;
}

function processConf(conf) {
    debug('process conf file');
    if(typeof conf.port === 'object' && conf.port.regexp) {
        var dir = conf.port.dir || '/dev';
        var l = fs.readdirSync(dir);
        var regexp = new RegExp(conf.port.regexp);

        for(var i=0; i< l.length; i++) {
            if(l[i].match(regexp)) {
                conf.port = path.join(dir, l[i]);
                break;
            }
        }
    }

    for(var i=0; i<conf.devices.length; i++) {
        _.merge(conf.devices[i], require('../devices/'+conf.devices[i].type+'.json'));
    }

}