Dispatcher
==========

Dispatch data from devices to the web

Configure
=========
Create appconfig.json file (configure your ip address and the port you want to use). Use default.json as a template. Don't commit appconfig.json

```
cp default.json appconfig.json
```

Install
=======
Start your server with a given configuration file (configuration files are 
```
    npm install
    node server.js --config zigbee
```
It may fail on macosx. You need then to install xcode (available for free from the appstore) and start it once to accept the licence !

Use
===
Go to http://[ip address]:[port]/

Nodemon
=======
Restart your server automatically everytime you save (VERY useful when developping)
```
sudo npm install -g nodemon
nodemon server.js
```

Debug
=====
Indicate for what files you want to see debug messages separated by commas
```
DEBUG=cache,RequestManager,parser nodemon server.js --config zigbee
```

