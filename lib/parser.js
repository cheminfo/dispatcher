var debug = require('debug')('parser');


exports = module.exports = {
    parse: function(cmd, result, options) {
        options = options || {};
        var commandReg = /^(\$[A-Z])?([a-z])(\d+)?/;
        var m = commandReg.exec(cmd);

        if(!m || !m[1]) {
            return false;
        }

        switch(m[2]) {
            case 'c':
                var nbParam = options.nbParam|| m[3];
                var reqLength = nbParam*4+14;
                var lines = result.split(/[\r\n]+/);
                // We are ready to process the next request
                var entries = [];
                if(lines.length >=2) {
                    entries = processLines(lines.slice(0,lines.length-1), reqLength);
                }
                return entries;
            default:
                return false;
        }
    }
};

function processLines(lines, reqLength) {
    var entries = [];
    for (var i=0; i<lines.length; i++) {
        var line=lines[i];
        var entry = processStatusLine(line, reqLength);
        if(entry) entries.push(entry);
    }
    return entries;
}

function processStatusLine(line, reqLength) {
    // this line contains the 26 parameters as well as the check digit. We should
    // only consider the line if the check digit is ok
    //console.log(line);

    var entry={};
    if(reqLength && line.length!= reqLength) {
        debug("Unexpected response length: ", line.length, 'instead of ', reqLength);
        return null;
    }

    if (checkDigit(line)) {
        entry.epoch=parseInt("0x"+line.substring(0,8));
        for (var j=0; j<26; j++) {
            if(j===0) entry.parameters = {};
            var value=convertSignedIntHexa(line.substring(8+(j*4),12+(j*4)));
            if (value==-32768) value=null;
            entry.parameters[String.fromCharCode(65+j)]=value;
        }
        entry.deviceId = convertSignedIntHexa(line.substring(8+(26*4), 12+(26*4)));
    } else {
        debug('Check digit error', line);
        return null;
    }
    return entry;

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
}