var Promise = require('bluebird'),
    SerialPort = require("serialport").SerialPort,
    debug = require('debug')('RequestManager'),
    _ = require('lodash');


function RequestManager(config) {
    this.config = config;
    this.queueLength = 0;
    this.buffer = "";
    this.lastRequest = Promise.resolve();
    this.waitTime = config.waitTime || 250;
}


RequestManager.prototype = {
    init: function(config) {
        var that = this;

        if(config) this.config = config;
        return new Promise(function(resolve, reject) {
            debug('Init serial port. port:', that.config.port, ', baudrate: ', that.config.baudrate);

            var serialPort = new SerialPort(that.config.port, {
                baudrate: that.config.baudrate
            }, true); // this is the openImmediately flag [default is true]

            openConnection();

            function listenData(data) {
                //debug('Receive data from serial port', data);
                that.buffer += data.toString();
            }

            function openConnection() {
                serialPort.open(function (error) {
                    if ( error ) {
                        console.log('Connection to serial port failed, retrying in 2 seconds');
                        setTimeout(openConnection, 2000);
                    } else {
                        console.log('The connection is open');
                        // we add a listener when data are received
                        serialPort.on('data', listenData);
                        that.serialPort = serialPort;
                        return resolve(serialPort);
                    }
                });
            }
        });
    },

    addRequest: function(cmd, expectedLength) {
        this.queueLength++;
        this.lastRequest = this.lastRequest.then(this.newRequest(cmd, expectedLength));
        return this.lastRequest;
    },

    newRequest: function(cmd, expectedLength) {
        var that = this;
        return function() {
            return new Promise(function(resolve) {
                that.resolveRequest = resolve;
                that.expectedLength = expectedLength;
                that.timeout = setTimeout(function() {
                    //debug('resolve after timeout');
                    that.resolve(that.buffer);
                    that.buffer = "";
                },that.waitTime);
                //debug('write to serial port', cmd);
                that.serialPort.write(cmd + '\n', function(err, results) {
                    if (err) {
                        console.log('err ' + err);
                        // Just go to the next request
                        debug('resolve because of write error', err);
                        that.resolve();
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


exports = module.exports = RequestManager;