'use strict';

var app = require('../bootstrap/data-api-bootstrap');
var config = require('../configs/config');

// Initialize configuration
var appconfig = config.getAppconfig();
var serverConfig = config.getServerConfig();
config.loadFromArgs();

var ipaddr = serverConfig.ipaddress || '127.0.0.1';

app.set("port", serverConfig.port || 8000);
app.set("ipaddr", ipaddr); // by default we listen to all the ips
app.set("serveraddress", ipaddr);

// Initialize modules
var modules = ['database'];

for (var i = 0; i < modules.length; i++) {
    var router = require('../routes/' + modules[i]);
    app.use('/' + modules[i], router);
}

// Create and launch server
var http = require("http").createServer(app);
http.listen(app.get("port"), app.get("ipaddr"), function () {
    console.log('Server launched. Go to ', "http://" + app.get("serveraddress") + ":" + app.get("port"));
});