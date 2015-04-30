
function idStringToNumber(idString) {
        return idString.charCodeAt(0) * 256 + idString.charCodeAt(1);
}

function idNumberToString(idNumber) {
    // TODO: implement
}

exports = module.exports = {
    deviceIdStringToNumber: idStringToNumber,
    deviceIdNumberToString: idNumberToString
};