Dispatcher
==========

Dispatch data from devices to the web

Configure
=========
Create appconfig.json file. Use default.json as a template. Don't commit appconfig.json

Install
=======
Start your server with a given configuration file
npm install
node server.js --config zigbee

Use
===
Go to http://

Nodemon
=======
Restart your server automatically everytime you save (VERY useful when developping)
sudo npm install -g nodemon
nodemon server.js

Debug
=====
Indicate for what files you want to see debug messages separated by commas
DEBUG=cache,RequestManager,parser 

