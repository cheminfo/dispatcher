Dispatch data from devices to the web. This project is able to capture information from RS232 and distribute it on a webpage

Requirements
========
Have gcc installed (C/C++ compiler)
On Mac OSX, this means you must have XCode install (available for free from the appstore) and start it once to accept the licence !

Launch the server
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
cp serverConfigDefault.json appconfig.json       # Copy from template
vim appconfig.json                               # Edit
```

For changes to be effective you must relaunch the server.


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
DEBUG=cache,SerialQueueManager,parser nodemon server.js --config zigbee
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
cp default.json appconfig.json
npm install
```

## Install monitoring
```
apt-get install monit
```









