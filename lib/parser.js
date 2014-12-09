var debug = require('debug')('parser');


exports = module.exports = {
    parse: function(cmd, result, options) {
        options = options || {};
        var commandReg = /^(.{2})?([a-z])(\d+)?/;
        var m = commandReg.exec(cmd);

        if(!m || !m[2]) {
            debug('The command did not match the regex.');
            return false;
        }

        switch(m[2]) {
            case 'c':
                // If c was specify without the number of params to retrieve
                // We use the parameter in the device config file
                var nbParam = m[3] || options.nbParam;
                var reqLength = nbParam*4+14;
                var lines = result.split(/[\r\n]+/);
                // We are ready to process the next request
                var entries = [];
                if(lines.length >=2) {
                    debug('process lines');
                    entries = processLines(lines.slice(0,lines.length-1), reqLength, nbParam);
                }
                return entries;
            case 'm':
                if(!m[3]) return result;
                var nbParam = 26;
                var reqLength = nbParam*4+30;
                var lines = result.split(/[\r\n]+/);
                // We are ready to process the next request
                var entries = [];
                if(lines.length >=2) {
                    debug('process lines');
                    entries = processLinesM(lines.slice(0,lines.length-1), reqLength, nbParam);
                }
                return entries;
            default:
                return false;
        }
    }
};

function processLinesM(lines, reqLength, nbParam) {
    var entries = [];
    for (var i=0; i<lines.length; i++) {
        if(i === 0) {
            debug('first processed line', lines[0]);
        }
        var line=lines[i];
        var entry = processStatusLineM(line, reqLength, nbParam);
        if(entry) entries.push(entry);
    }
    return entries;
}

function processLines(lines, reqLength, nbParam) {
    var entries = [];
    for (var i=0; i<lines.length; i++) {
        var line=lines[i];
        var entry = processStatusLine(line, reqLength, nbParam);
        if(entry) entries.push(entry);
    }
    return entries;
}

function processStatusLine(line, reqLength, nbParam) {
    // this line contains the 26 parameters as well as the check digit. We should
    // only consider the line if the check digit is ok
    //console.log(line);

    var entry={};
    if(reqLength && line.length!= reqLength) {
        debug("Unexpected response length: ", line.length, 'instead of ', reqLength);
        throw new Error('Unexpected response length');
    }

    if (checkDigit(line)) {
        entry.epoch=parseInt("0x"+line.substring(0,8));
        parseParameters(line, 8, nbParam, entry);
        entry.deviceId = convertSignedIntHexa(line.substring(8+(nbParam*4), 12+(nbParam*4)));
        if(!entry.deviceId) {
            throw new Error('Could not parse device id');
        }
    }
    else {
        debug('Check digit error', line);
        throw new Error('Check digit error');
    }
    return entry;




}

function processStatusLineM(line, reqLength, nbParam) {
    var entry={};
    if(reqLength && line.length!= reqLength) {
        debug("Unexpected response length: ", line.length, 'instead of ', reqLength);
        throw new Error('Unexpected response length');
    }

    if (checkDigit(line)) {
        entry.id = parseInt("0x"+line.substring(0,8));
        entry.epoch=parseInt("0x"+line.substring(8,16));
        parseParameters(line, 16, nbParam, entry);
        // We skip the events for now
        entry.deviceId = convertSignedIntHexa(line.substring(16+(nbParam*4)+8, 16+(nbParam*4)+8+4));
        if(!entry.deviceId) {
            throw new Error('Could not parse device id');
        }
    }
    else {
        debug('Check digit error', line);
        throw new Error('Check digit error');
    }
    return entry;
}


// Utility functions
function parseParameters(line, start, nbParam, entry) {
    for (var j=0; j<nbParam; j++) {
        if(j===0) entry.parameters = {};
        var value=convertSignedIntHexa(line.substring(start+(j*4),start+4+(j*4)));
        if (value==-32768) value=null;
        if (j<26) entry.parameters[String.fromCharCode(65+j)]=value;
        else entry.parameters[String.fromCharCode(65,65+j-26)]=value;
    }
}


function checkDigit(line) {
    var checkDigit=0;
    for (var i=0; i<line.length; i=i+2) {
        checkDigit^=parseInt("0x"+line[i]+line[i+1]);
    }
    if (checkDigit==0) return true;
    return false;
}

function convertSignedIntHexa(hexa) {
    var value=parseInt("0x"+hexa);
    if (value>32767) {
        return (65536-value)*-1;
    }
    return value;
}