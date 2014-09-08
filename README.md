Dispatcher
==========

Dispatch data from devices to the web. This project is able to capture information from RS232 and distribute it on a webpage

Configure
=========
Create appconfig.json file (configure your ip address and the port you want to use). Use default.json as a template. Don't commit appconfig.json

```
cp default.json appconfig.json
```

Install
=======
Start your server with a given configuration file and optionally with a given view file.

```
    npm install
    node server.js --config zigbee --view dispatcher
```
This will look for the configuration file ``` ./configs/zigbee.json ``` and for the view ``` ./static/views/dispatcher.json ```.
It may fail on macosx. You need then to install xcode (available for free from the appstore) and start it once to accept the licence !

Use
===
Go to http://[ip address]:[port]/

Advanced settings
=================

This could be used with 2 related projecdts [BioReactor](https://github.com/bioreactor) and [Legoino](https://github.com/lpatiny/legoino)

When you start the program and you specify the argument ``--config zigbee`` the system will look for a file named ``./configs/zigbee.json``.
You may create any new file in this ``./configs`` folder. For example you could create ``bioreactor.json`` and then start the program with 
```
node server.js --config bioreactor
```

## configs

The configuration files are stored in ``./configs``.

In a config file you will define all the devices that should be monitored (as an array) as well as their type. A device is characterised by :
* type: corresponds to the name of a file that is in the folder ``./devices`` and that will describe exactly the feature of this type of device.
* description: free name
* prefix: the prefix that has to be send to communicate to this device. If you connect directly the device to the computer this should be empty, if you use a master/slave configuration with zigbee this should contain the address of the device.
* id: ID of the device. Each device should have a unique ID and this will be used to stored in the corresponding database. This should correspond to the ID of the device that is defined using the "q" parameter in the configuration menu and that is calculated based on the ASCII code table. For example, $A (ASCII $: 36, A: 65) should be defined using 36 * 256 + 65 = 9281. On a board you would then enter "q9281"
Global parameters in this file allow to define:
* port: the name of the device. For a zigbee hub it could be on linux: ``/dev/ttyUSB0`` or on macosx: ``/dev/tty.SLAB_USBtoUART``. If connected directly on the computer is could be on macosx ``/dev/tty.usbmodem1451``.
* baudrate: for a zigbee hub from [Shuncom](http://www.shuncomwireless.com/) the speed should be 38400. When connecting directly with an Arduino it should be by default 9600.

## devices

Each device is defined by a file in ``./devices``folder. A device may be the gaz controller or the bioreactor controller. You will need to define for each board which parameters are used and what are the corresponding name / value of this parameter.

You may also define how often this device has to be updated.

For Developpers
===============

## Nodemon
Restart your server automatically everytime you save (VERY useful when developping)
```
sudo npm install -g nodemon
nodemon server.js
```

## Debug
Indicate for what files you want to see debug messages separated by commas
```
DEBUG=cache,RequestManager,parser nodemon server.js --config zigbee
```
