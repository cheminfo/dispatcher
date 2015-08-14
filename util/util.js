function idStringToNumber(idString) {
    if (idString.length === 2 && idString[0] === '%' || idString[0] === '$') {
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