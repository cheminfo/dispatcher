Dispatch data from devices to the web. This project is able to capture information from RS232 and distribute it on a webpage

Requirements
========
Have gcc installed (C/C++ compiler)
On Mac OSX, this means you must have XCode install (available for free from the appstore) and start it once to accept the licence !

Launch the servers
=======
Start your server.

```
    npm install
    node server.js
```

App configuration
==============
Go to http://[ip address]:[port]/ to configure your application. This will load an admin view where you can see and edit all your configurations. Edit and save the "appconfig" window and click "Reload configuration". This will relaunch the dispatcher with the new settings.

Configuration options:
* config: the name of the configuration file. The configuration file contains a description of all connected devices. You can specify several configuration files separating them with commas.
* view: the name of the default view. This is the view that will be loaded when requesting the root path in your browser.

View navigation
=============
Go to http://[ip address]:[port]/. Make sure you have a valid configuration loaded. Click on "Nav views" in the header. Then browse the available views and double-click any you would like to load. The default available views are:
* admin view: enables you to edit your configuration files and relaunch the dispatcher.
* dispatcher view: enables you to view the state of connected devices, edit parameters on them, send commands etc...

You can also create your own views and save them easily.

Server configuration
=========
```serverConfig.json``` contains all the server configuration option, like ip address and port. By default, the ip address is automatically detected and the port used is 80.
For advanced users, you can edit the server configuration. You must create a file named ```serverConfig.json```. You can use ```defaultServerConfig.json``` as a template.

```
cp defaultServerConfig.json serverConfig.json       # Copy from template
vim serverConfig.json                               # Edit
```

For changes to be effective you must relaunch the server.

## Other server options
* bodyLimit: You may have to change this if you want to send large amounts of data to the server. This may be required when saving a large view.


Advanced settings
=================

This could be used with 2 related projecdts [BioReactor](https://github.com/bioreactor) and [Legoino](https://github.com/lpatiny/legoino)

When you start the program and you specify the argument ``--config zigbee`` the system will look for a file named ``./configs/zigbee.json``.
You may create any new file in this ``./configs`` folder. For example you could create ``bioreactor.json`` and then start the program with 
```
node server.js --config bioreactor
```

## Dispatcher configuration
There are two places where to define configuration files.
1. ``` configs/myconfig.json ```. Here you define the boards that are physically connected to the computer via a serial board, and the list and type of devices associated to that board
2. devices/mydevice.json. Here you define a type of device, which is mainly characterized by it’s parameters (A, B etc…)

###### Board
The configuration contains the list of boards that the dispatcher should be looking for. The basic structure for the configuration file is: 
```json
[
  {
    "devices": {}
  },
  {
    "devices": {}
  }
]
```
Each element in the array represents a board that is physically connected (via a serial port) to the machine that is running the dispatcher (here the raspberry pi). 
If there is only one board connected, then you don’t have to use an array:
```json
{
  "devices": {}
}
```

The best way to connect several boards is to define one board per file and to specify several configuration files when launching the dispatcher.
A board has several parameters:
```json
{
  "devices": {},
  "port": "/dev/tty.SLAB_USBtoUART",
  "baudrate": 38400,
  "sqlite": {},
  "serialResponseTimeout": 259
}
```
**baudrate**: the serial connection’s data rate. For a zigbee hub from [Shuncom](http://www.shuncomwireless.com/) the speed should be 38400. When connecting directly with an Arduino it should be 9600.
**port**: the serial connection’s port. For a zigbee hub it could be on linux: ``/dev/ttyUSB0`` or on macosx: ``/dev/tty.SLAB_USBtoUART``. If connected directly on the computer is could be on macosx ``/dev/tty.usbmodem1451``.
The port can be a regular expression: (usefull because names can change when replugged)
```json
"port": {
  "dir": "/dev",
  "regexp": "usbmodem.*"
}
```
* **sqlite** (optional): the sqlite database configuration. This configuration can be overridden in the device configuration.
* **serialResponseTimeout** (optional): This manages the time (in milseconds) the serial port should be waiting for a response. It’s important to set this parameter correctly! (you should use trial and error…). If this parameter is too small, you will send new commands before having the entire response to the previous commands. If you set this parameter too high, the command queue will get bigger and bigger and you will have high latency.
* **description**: Describes what this config does
* **devices**: Each board can have several devices. If the board has zigbee, then you can have several devices defined, therefore it’s an array

```json
"devices" : [
    {
        "type":"mlog",
        "description":"Mlog device",
        "prefix":"$A",
        "id": "$A",
        "sqlite": {}
    }
]
```

**devices**:
* **type**: the type of device. Devices are specified in separate configuration files and this parameter enables to identify it.
* **description**: A description of the device
* **prefix**: the prefix that should be use when sending commands through the serial port. If you connect directly the device to the computer this should be empty, if you use a master/slave configuration with zigbee this should contain the address of the device. The prefix usually is a ``$`` or a ``%`` followed by a letter, for example ``$A``
 This is important for zigbee devices since commands must be prefixed. Leave empty if it’s not a zigbee device
* **id**: a unique identifier for the device. For zigbee devices, use the prefix. The id should to how the id of the device was defined with the "q" command, using ASCII table conversions. For example, $A (ASCII $: 36, A: 65) should be defined using 36 * 256 + 65 = 9281. On a board it corresponds to the command "q9281".
* **sqlite**: the sqlite can be configured per device. If not specified in the device, the sqlite config of the board is used.

###### Devices
Device configuration files are on separate files and correspond to a type in the main configuration file. So if you have a device in the main config file with the type “abc”, the loading procedure will look for the file devices/abc.json. This system enables to have several devices with the same parameters without duplicating them in the config file. (will be useful for solar decathlon)
Here is the structure of a device configuration file: 
```json
{
    "parameters": {
        "A": {
            "label": "Internal temperature",
            "name": "internalTemperature",
            "factor": 0.01
        },
        "B": {
            "label": "External temperature",
            "name": "externalTemperature",
            "factor": 0.01
        },
        "C": {
            "label": "Target temperature",
            "type": "number",
            "factor": 0.01,
            "editable": true
        }
    },
    "refresh": 1000,
    "nbParamCompact": 26,
    "multiLog": false
}
```

* **parameters**: key/value where the key is the parameter id
  * **label**: parameter label
  * **name**: ?? (i don’t think this is used…)
  * **factor**: the multiplication factor to get the correct value for the given units
  * **unit**: the unit measure (celsius, bar, perc. humidity etc…) (not used yet)
* **multiLog**: weather the device is multilog or not. When multilog, the log content is persisted to the database.
* **nbParam**: the total number of parameters the device can have (A-Z ⇒ 26, A-Z,AA-AZ ⇒ 52)
* **refresh**: the period of refresh in miliseconds. For a multilog device, a refresh will save new 

data to the database. For a non-multilog device, a refresh will put the latest parameter values in cache.

Each board can have several devices. If the board has zigbee, then you can have several devices defined.

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
DEBUG=cache,SerialQueueManager,parser,database,PromiseWrapper nodemon server.js --config zigbee
```
You can also debug with all the debug informations
```
DEBUG=* nodemon server.js --config zigbee
```


On a raspberry PI
=================

## Create a boot SD card

* Download raspbian and unzip the file to get the .img. (http://www.raspberrypi.org/downloads)
* unmount the disk (don't eject it !!!) and remember the ID of the disk. On MacOSX:
```
sudo diskutil unmount /dev/disk3s1
```
* or on linux
```
unmount /dev/sdXN
```
* dump the image to the sd card (add the “r” in front of “disk” to use a faster device (http://elinux.org/RPi_Easy_SD_Card_Setup)). It will take several minutes to complete. Dump to the disk and not to the partition. Be sure you write on the correct disk number or YOU WILL LOSE ALL YOUR DATA ON YOUR COMPUTER.
```
sudo dd bs=1m if=2014-01-07-wheezy-raspbian.img of=/dev/rdiskXXX
```
* eject the SD after dd is over

## Post install configuration raspi-config

* resize the partition
* change password (user=pi)
* choose default locale to en_US.UTF-8 UTF-8
* set time zone

## Fixed IP address

```
vi /etc/network/interfaces
auto eth0
iface eth0 inet static
address 192.168.2.1
netmask 255.255.255.0
gateway 192.1.2.254
/etc/init.d/networking restart
```

## Must have packages
````
sudo bash
apt-get update
apt-get install dnsutils
apt-get install apt-file
apt-file update
```

## Install node JS
```
cd /usr/local/src
wget "http://nodejs.org/dist/v0.10.28/node-v0.10.28-linux-arm-pi.tar.gz"
tar -xzvf "node*tar.gz"
mkdir -p /usr/local/node
mv "node-*pi" /usr/local/node
ln -s /usr/local/node/node*pi /usr/local/node/latest
ln -s /usr/local/node/latest/bin/node /usr/local/bin/node
ln -s /usr/local/node/latest/bin/npm /usr/local/bin/npm
```

## Install dispatcher
```
cd /usr/local/node
git clone "https://github.com/cheminfo/dispatcher.git"
cd dispatcher
cp defaultAppconfig.json appconfig.json
npm install
```

## Install monitoring
```
apt-get install monit
```


Known issues
===========
* Getting an error when saving file in the nav view: it could be that what you are trying to save is too large. Open the server configuration file ```serverConfig.json``` and edit the ```bodyLimit``` option. Increase it.






