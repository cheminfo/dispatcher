function idStringToNumber(idString) {
    if(idString === undefined) return;

    if (idString.length === 2) {
        return idString.charCodeAt(0) * 256 + idString.charCodeAt(1);
    }
    return idString;
}

function idNumberToString(idNumber) {
    return String.fromCharCode(idNumber / 256 | 0) + String.fromCharCode(idNumber % 256);
}

exports = module.exports = {
    deviceIdStringToNumber: idStringToNumber,
    deviceIdNumberToString: idNumberToString,
    addCheckDigit: addCheckDigit
};

function addCheckDigit(str) {
    if(!(typeof str === 'string')) throw new TypeError('addCheckDigit expects a string');
    var checkDigit = 0;
    for (var i = 0; i < str.length; i++) {
        checkDigit ^= str.charCodeAt(i);
    }
    return str + String.fromCharCode(checkDigit);
}