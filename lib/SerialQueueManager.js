var Promise = require('bluebird'),
    SerialPort = require("serialport").SerialPort,
    debug = require('debug')('SerialQueueManager'),
    _ = require('lodash');


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
        if(config) this.config = config;
        debug('Init serial port. port:', that.config.port, ', baudrate: ', that.config.baudrate);

        that.serialPort = new SerialPort(that.config.port, {
            baudrate: that.config.baudrate
        }, true); // this is the openImmediately flag [default is true]

        that.initPromise =  that.reinitSerialConnection();
    },

    reinitSerialConnection: function() {
        debug('reinit serial connection');
        var that = this;
        function listenData(data) {
            //debug('Receive data from serial port', data);
            that.buffer += data.toString();
        }

        return new Promise(function(resolve) {
            that.serialPort.on('error', function(err) {
                that.ready = false;
            });

            that.serialPort.open(function (error) {
                if ( error ) {
                    // Try again in 2 seconds
                    that.ready = false;
                    setTimeout(function() {
                        that.reinitSerialConnection();
                    }, 2000);
                } else {
                    debug('The connection is open');
                    // we add a listener when data are received
                    that.serialPort.on('data', listenData);
                    that.ready = true;
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

    addRequest: function(cmd, expectedLength) {
        if(!this.ready) {
            return Promise.reject('The request manager is not ready...');
        }
        this.queueLength++;
        this.lastRequest = this.lastRequest.then(this.newRequest(cmd, expectedLength), this.newRequest(cmd, expectedLength));
        return this.lastRequest;
    },

    newRequest: function(cmd, expectedLength) {
        var that = this;
        return function() {
            return new Promise(function(resolve, reject) {
                that.resolveRequest = resolve;
                that.rejectRequest = reject;
                that.expectedLength = expectedLength;
                that.timeout = setTimeout(function() {
                    //debug('resolve after timeout');
                    that.resolve(that.buffer);
                    that.buffer = "";
                },that.serialResponseTimeout);
                //debug('write to serial port', cmd);
                that.serialPort.write(cmd + '\n', function(err, results) {
                    if (err) {
                        that.handleError(err);
                        // Just go to the next request
                        debug('resolve because of write error', err);
                        return reject();
                    }
                });
            });
        }
    },

    resolve: function() {
        this.queueLength--;
        this.resolveRequest(arguments[0]);
    }


};


exports = module.exports = SerialQueueManager;