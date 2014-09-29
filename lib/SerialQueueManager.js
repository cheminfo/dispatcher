var Promise = require('bluebird'),
    SerialPort = require("serialport").SerialPort,
    debug = require('debug')('SerialQueueManager'),
    _ = require('lodash'),
    fs = require('fs'),
    path = require('path');


function SerialQueueManager(config) {
    this.config = config;
    this.queueLength = 0;
    this.buffer = "";
    this.lastRequest = Promise.resolve();
    this.serialResponseTimeout = config.serialResponseTimeout || 250;
}


SerialQueueManager.prototype = {
    init: function(config) {
        var that = this;
        this.ready = false;
        this.status = 'Serial port not initialized';
        if(config) this.config = config;
        debug('Init serial port. port:', that.config.port, ', baudrate: ', that.config.baudrate);



        that.initPromise =  that.reinitSerialConnection();
    },

    reinitSerialConnection: function() {
        debug('reinit serial connection');
        var that = this;

        if(!this.serialPort) {
            // Check that this serial port exists
            var port;
            if(port = this.getPort()) {
                that.serialPort = new SerialPort(port, {
                    baudrate: that.config.baudrate
                }, true); // this is the openImmediately flag [default is true]
            }
            else {
                tryLater();
                return;
            }
        }

        function listenData(data) {
            //debug('Receive data from serial port', data);
            that.buffer += data.toString();
        }

        function tryLater() {
            that.ready = false;
            that.status = 'Unable to connect to device'
            if(!that.isWarned) console.log('Unable to connect to port ', that.port,'. Please check if your device is connected or your device configuration. We will retry connecting every 2 seconds');
            that.isWarned = true;
            setTimeout(function() {
                that.reinitSerialConnection()
            }, 2000);
        }

        return new Promise(function(resolve) {
            that.serialPort.on('error', function(err) {
                that.ready = false;
            });

            that.serialPort.open(function (error) {
                if ( error ) {
                    // Try again in 2 seconds
                    tryLater();
                } else {
                    // TODO: Before setting the queue manager as ready, we should
                    // get the device's unique id
                    debug('The connection is open');
                    console.log('Successfully opened connection with port ', that.port);
                    that.isWarned = false;
                    // we add a listener when data are received
                    that.serialPort.on('data', listenData);
                    that.ready = true;
                    that.status = 'Ok';
                    return resolve(that.serialPort);
                }
            });
        });

    },

    handleError: function(err) {
        var that = this;
        if(!this.ready) return; // Already handling an error
        this.ready = false;

        this.serialPort.close(function() {
            debug('Connection to serial port failed, closing connection and retrying in 2 seconds', err);
            if(err) {
                debug('serial port could not be closed');
            }
            else {
                debug('serial port was closed');
            }
            setTimeout(function() {
                that.reinitSerialConnection();
            }, 2000);
        });
    },

    addRequest: function(cmd, options) {
        options = options || {};
        if(!this.ready) {
            return Promise.reject(this.status);
        }
        this.queueLength++;
        this.lastRequest = this.lastRequest.then(this.newRequest(cmd, options.timeout), this.newRequest(cmd, options.timeout));
        return this.lastRequest;
    },

    newRequest: function(cmd, timeout) {
        var that = this;
        timeout = timeout || this.serialResponseTimeout;
        return function() {
            return new Promise(function(resolve, reject) {
                that.resolveRequest = resolve;
                that.rejectRequest = reject;
                that.timeout = setTimeout(function() {
                    //debug('resolve after timeout');
                    that.resolve(that.buffer);
                    that.buffer = "";
                },timeout);
                //debug('write to serial port', cmd);
                that.serialPort.write(cmd + '\n', function(err, results) {
                    if (err) {
                        that.handleError(err);
                        // Just go to the next request
                        debug('resolve because of write error', err);
                        return reject(new Error('Error writing to serial port'));
                    }
                });
            });
        }
    },

    resolve: function() {
        this.queueLength--;
        this.resolveRequest(arguments[0]);
    },

    getPort: function(port) {
        port = port || this.config.port;

        if(typeof port === 'object' && port.regexp) {
            var dir = port.dir || '/dev';
            var l = fs.readdirSync(dir);
            var regexp = new RegExp(port.regexp);
            for(var i=0; i< l.length; i++) {
                if(l[i].match(regexp)) {
                    port = path.join(dir, l[i]);
                    if(port = this.getPort(port)) {
                        return port;
                    }
                }
            }
            return null;
        }

        else {
            this.port = port;
            try {
                if(fs.statSync(port).isCharacterDevice());
                return port;
            } catch(err) {
                debug(err);
                return null;
            }
        }
    }


};


exports = module.exports = SerialQueueManager;