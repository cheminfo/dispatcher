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

Filter.prototype.chartFromDatabaseEntries = function(dbEntries, deviceId) {
    if(!(dbEntries instanceof Array)) {
        dbEntries = [dbEntries];
    }
    // Check if those are normal or mean values
    var isMean = _(dbEntries[0]).keys().any(function(key) {
        return key.indexOf('mean') > -1;
    });

    if(isMean) {
        return chartFromMeanDbEntries(dbEntries, deviceId);
    }
    else {
        return chartFromDbEntries(dbEntries, deviceId);
    }
};

function normalizeParameterValue(device, paramName, value) {
    var factor = device.parameters[paramName].factor || 1;
    return value*(+factor);
}

function chartFromMeanDbEntries(dbEntries, deviceId) {
    var chart = {
        type: 'chart',
        value: {
            title: 'data',
            data: []
        }
    };

    var keys = _(dbEntries[0]).keys().filter(function(key) {
        return key.match(/^[A-Z]{1,2}_mean$/);
    }).value();


    for(var i=0; i<keys.length; i++) {
        var x=[], y=[], min=[], max=[];
        for(var j=0; j<dbEntries.length; j++) {
            x.push(dbEntries[j].epoch)
            y.push(dbEntries[j][keys[i]]);
            min.push(dbEntries[j][keys[i].replace('_mean','_min')]);
            max.push(normalizeParameterValue(deviceId, keys[i], dbEntries[j][keys[i].replace('_mean', '_max')]));
        }
        chart.value.data.push({x:x, y:y});
        chart.value.data.push({serieType: 'zone', x: x, yMin: min, yMax: max});
    }

    return chart;
}

function chartFromDbEntries(dbEntries, deviceId) {
    var chart = {
        type: 'chart',
        value: {
            title: 'data',
            data: []
        }
    };

    var keys = _(dbEntries[0]).keys().filter(function(key) {
        return key.match(/^[A-Z]{1,2}$/);
    }).value();

    for(var i=0; i<keys.length; i++) {
        var x=[];
        var y=[];
        for(var j=0; j<dbEntries.length; j++) {
            x.push(dbEntries[j].epoch)
            y.push(normalizeParameterValue(deviceId, keys[i], dbEntries[j][keys[i]]));
        }
        chart.value.data.push({x:x, y:y});
    }
    return chart;
}