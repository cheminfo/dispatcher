function idStringToNumber(idString) {
    if(idString === undefined) return;

    if (idString.length === 2) {
        return idString.charCodeAt(0) * 256 + idString.charCodeAt(1);
    }
    return idString;
}

function idNumberToString(idNumber) {
    // TODO: implement
}

exports = module.exports = {
    deviceIdStringToNumber: idStringToNumber,
    deviceIdNumberToString: idNumberToString
};