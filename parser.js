var debug = require('debug')('parser');


exports = module.exports = {
    parse: function(cmd, result) {
        var commandReg = /^(\$[A-Z])?([a-z])/;
        var m = commandReg.exec(cmd);

        if(!m || !m[1]) {
            return false;
        }

        switch(m[2]) {
            case 'c':
                var lines = result.split(/[\r\n]+/);
                // We are ready to process the next request
                var entries = [];
                if(lines.length >=2) {
                    entries = processLines(lines.slice(0,lines.length-1));
                }
                return entries;
            default:
                return false;
        }
    }
};

function processLines(lines) {
    var entries = [];
    for (var i=0; i<lines.length; i++) {
        var line=lines[i];
        var entry = processStatusLine(line)
        if(entry) entries.push(entry);
    }
    return entries;
}

function processStatusLine(line) {
    // this line contains the 26 parameters as well as the check digit. We should
    // only consider the line if the check digit is ok
    //console.log(line);

    var entry={};
    var reqlength = 8+26*4+2+4;
    if (line.length!= reqlength) {
        debug("Unexpected response length: ", line.length, 'instead of ', reqlength);
        return null;
    }

    if (checkDigit(line)) {
        entry.epoch=parseInt("0x"+line.substring(0,8));
        for (var j=0; j<26; j++) {
            var value=convertSignedIntHexa(line.substring(8+(j*4),12+(j*4)));
            if (value==-32768) value=null;
            entry[String.fromCharCode(65+j)]=value;
        }
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