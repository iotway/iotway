const lib = require('libiotway');
let calls = null;

module.exports.init = async function () { //host, username, password; //host, token

    try {
        if (arguments.length == 2) {
            calls = await lib.init(arguments[0], arguments[1]);
            return calls;
        }
        if (arguments.length == 3) {
            calls = await lib.init(arguments[0], arguments[1], arguments[2]);
            return calls
        }
    }
    catch (err) {
        console.log(err)
    }


}

module.exports.get = function () {
    //console.log('AM APELAT GET')
    return calls;
}