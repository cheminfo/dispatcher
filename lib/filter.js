var _ = require('lodash');

var Filter = exports = module.exports =  function Filter(){
    this.config = require('../configs/config').get();
};

Filter.prototype.visualizer = function(entries) {

    var filtered = {};
    for(var id in entries) {
        filtered[id] = {};
        filtered[id].parameters = [];
        filtered[id].epoch = entries[id].epoch;
        filtered[id].deviceId = entries[id].deviceId;

        // Find the device in the config by id
        var idx = _.findIndex(this.config.devices, function(device) {
            return device.id === id;
        });
        for(var key in entries[id].parameters) {
            filtered[id].parameters.push({
                name: key,
                mappedName: this.config.devices[idx].parameters[key] ? this.config.devices[idx].parameters[key].name : 'NA',
                value: entries[id].parameters[key],
                label: this.config.devices[idx].parameters[key] ? this.config.devices[idx].parameters[key].label : 'NA'
            });
        }
    }
    return filtered;
};