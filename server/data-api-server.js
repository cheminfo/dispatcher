'use strict';

var app = require('../bootstrap/data-api-bootstrap');

app.set("port", 8787);
app.set("ipaddr", '127.0.0.1'); // by default we listen to all the ips
app.set("serveraddress", '127.0.0.1');


// Initialize modules
var modules = ['database'];

for(var i=0; i<modules.length; i++) {
    var router = require('../routes/'+modules[i]);
    app.use('/'+modules[i], router);
}

// Create and launch server
var http = require("http").createServer(app);
http.listen(app.get("port"), app.get("ipaddr"), function() {
    console.log('Server launched. Go to ', "http://" + app.get("serveraddress") + ":" + app.get("port"));
});