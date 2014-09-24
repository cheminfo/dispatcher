var _ = require('lodash');

var Filter = exports = module.exports =  function Filter(config){
    this.config = config;
};

Filter.prototype.visualizer = function(entries) {

    var filtered = {};

    for(var id in entries) {
        filtered[id] = this.visualizerDevice(id, entries[id]);
    }

    return filtered;
};

Filter.prototype.visualizerDevice = function(id, entry) {
    var filtered = {};

    filtered.parameters = [];
    filtered.epoch = entry.epoch;
    filtered.deviceId = entry.deviceId;
    // Find the device in the config by id

    var device = this.config.findDeviceById(id);

    for(var key in device.parameters) {
        if(!entry.parameters.hasOwnProperty(key)) continue;
        filtered.parameters.push({
            name: key,
            mappedName: device.parameters[key] ? device.parameters[key].name : 'NA',
            value: normalizeParameterValue(device, key, entry.parameters[key]),
            label: device.parameters[key] ? device.parameters[key].label : 'NA'
        });
    }
    return filtered;
};

Filter.prototype.visualizerChart = function(id, entries) {
    var that = this;
    var chart = {
        type: 'chart',
        value: {
            title: 'data',
            data: []
        }
    };

    var filteredEntries = _.map(entries, function(val) {
        return that.visualizerDevice(id, val);
    });




    for(var key in filteredEntries[0].parameters) {
        var x = [];
        var y = [];
        for(var i=0; i<filteredEntries.length; i++) {
            x.push(filteredEntries[i].epoch);
            y.push(filteredEntries[i].parameters[key]);
        }
        chart.value.data.push(
            {
                x: x,
                y: _.pluck(y, 'value')
            }
        );
    }


    return chart;
};

function normalizeParameterValue(device, paramName, value) {
    var factor = device.parameters[paramName].factor || 1;
    return value*(+factor);
}