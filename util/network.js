var os=require('os');
var ifaces=os.networkInterfaces();

exports = module.exports = {
    getMyIps: getMyIps,
    getMyIp: getMyIp,
    validateIp: validateIp
};

function getMyIps() {
    var ips =[];
    for (var dev in ifaces) {
        ifaces[dev].forEach(function(details){
            if (details.family=='IPv4' && details.internal === false) {
                ips.push(details.address);
            }
        });
    }
    return ips
}


function getMyIp() {
    var r = getMyIps();

    if(r.length === 0) return undefined;
    else return r[0];
}

function validateIp(ip) {
    return ip.match(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/);
}

