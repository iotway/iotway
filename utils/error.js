const fs = require ('fs-extra');
const settings = require ('./settings');

process.on('uncaughtException', function(err) {
    try{
        fs.appendFileSync (settings.errorFile, err.stack+'\n');
    }
    catch (e){
        try{
            fs.appendFileSync (settings.errorFile, err.stack+'\n');
        }
        catch (e){
        }
    }
    console.log (settings.executor + ' enountered an internal error.');
    console.log ('Please check log files in '+ settings.settingsDir);
    process.exit (-1);
});
    
exports.addError = function (error){
    try{
        fs.appendFileSync (settings.errorFile, error);
    }
    catch (e){
    }
}