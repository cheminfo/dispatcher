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
    this.serialResponseTimeout = config.serialResponseTimeout || 125;
    this.ready = false; // True if ready to accept new requests into the queue
    this.currentRequest = Promise.resolve(''); // The current request being executed
    this.lastRequest = Promise.resolve('');
}


SerialQueueManager.prototype = {
    init: function (config) {
        var that = this;
        this.ready = false;
        this.status = 'Serial port not initialized';
        if (config) this.config = config;
        debug('Init serial port. port:', that.config.port, ', baudrate: ', that.config.baudrate);


        that.initPromise = that.reinitSerialConnection();
    },

    reinitSerialConnection: function () {
        debug('reinit serial connection');
        var that = this;
        var oldPort = this.port;
        if (oldPort !== this.getPort()) {
            // Check that this serial port exists
            var port;
            if (port = this.getPort()) {
                that.serialPort = new SerialPort(port, {
                    baudrate: that.config.baudrate
                }, true); // this is the openImmediately flag [default is true]
                that.serialPort.on('error', function (err) {
                    that.ready = false;
                });
            }
            else {
                that.status = 'Unable to find the port.';
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
            if (!that.isWarned) console.log('Unable to connect to port ', that.port, '. Please check if your device is connected or your device configuration. We will retry connecting every 2 seconds');
            that.isWarned = true;
            setTimeout(function () {
                that.reinitSerialConnection()
            }, 2000);
        }

        return new Promise(function (resolve) {
            that.serialPort.open(function (error) {
                if (error) {
                    // Try again in 2 seconds
                    that.status = 'Unable to open connection to port';
                    console.log(error);
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

    handleError: function (err) {
        debug('handle error, close serial port');
        var that = this;
        if (!this.ready) return; // Already handling an error
        this.ready = false;
        this.serialPort.close(function () {
            debug('Connection to serial port failed, closing connection and retrying in 2 seconds', err);
            if (err) {
                debug('serial port could not be closed');
            }
            else {
                debug('serial port was closed');
            }
            setTimeout(function () {
                that.reinitSerialConnection();
            }, 2000);
        });
    },

    addRequest: function (cmd, options) {
        options = options || {};
        if (!this.ready) {
            return Promise.reject(this.status);
        }
        this.queueLength++;
        this.lastRequest = this.lastRequest.then(this.newRequest(cmd, options.timeout), this.newRequest(cmd, options.timeout));
        return this.lastRequest;
    },

    newRequest: function (cmd, timeout) {
        var that = this;
        timeout = timeout || this.serialResponseTimeout;
        return function () {
            that.currentRequest = new Promise(function (resolve, reject) {
                debug('new request. Queue length is ' + that.queueLength);
                that.resolveRequest = resolve;
                that.rejectRequest = reject;
                var bufferSize = 0;
                doTimeout(true);
                debug('Sending command to serial port', cmd);
                that.serialPort.write(cmd + '\n', function (err, results) {
                    if (err) {
                        that.handleError(err);
                        // Just go to the next request
                        debug('write error occured, serial connection may be interrupted', err);
                        return reject(new Error('Error writing to serial port'));
                    }
                });

                function doTimeout(force) {
                    debug('buffer sizes', bufferSize, that.buffer.length);
                    if (bufferSize < that.buffer.length || force) {
                        if (force) {
                            debug('timeout forced');
                        }
                        bufferSize = that.buffer.length;
                        debug('timeout renewed');
                        that.timeout = setTimeout(function () {
                            doTimeout();
                        }, timeout);
                        return;
                    }
                    debug('buffer', that.buffer);
                    debug('command resolved');
                    that.resolve(that.buffer);
                    that.buffer = "";
                }
            });
            return that.currentRequest;
        }
    },

    resolve: function () {
        this.queueLength--;
        this.resolveRequest(arguments[0]);
    },

    getPort: function (port) {
        port = port || this.config.port;

        if (typeof port === 'object' && port.regexp) {
            var dir = port.dir || '/dev';
            var l = fs.readdirSync(dir);
            var regexp = new RegExp(port.regexp);
            for (var i = 0; i < l.length; i++) {
                if (l[i].match(regexp)) {
                    port = path.join(dir, l[i]);
                    if (port = this.getPort(port)) {
                        return port;
                    }
                }
            }
            return null;
        }

        else {
            this.port = port;
            try {
                if (fs.statSync(port).isCharacterDevice());
                return port;
            } catch (err) {
                debug(err);
                return null;
            }
        }
    },

    close: function () {
        var that = this;
        return new Promise(function (resolve, reject) {
            that.ready = false; // Stop accepting new requests
            that.status = 'Request manager is closing';
            that.lastRequest.then(function () {
                if (!that.serialPort) {
                    return resolve();
                }
                that.serialPort.close(function (err) {
                    if (err) {
                        debug('Close could not complete successfully');
                        return reject(err);
                    }
                    debug('Close completed successfully');
                    return resolve();
                });
            });
        });
    }


};


exports = module.exports = SerialQueueManager;