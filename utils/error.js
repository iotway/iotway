const fs = require ('fs-extra');
const settings = require ('./settings');
const path = require ('path');

process.on('uncaughtException', function(err) {
    try{
        fs.appendFileSync (path.join (settings.baseDir, 'error.log'), err.stack+'\n');
    }
    catch (e){
        try{
            fs.mkdirSync (settings.baseDir);
            fs.appendFileSync (path.join (settings.baseDir, 'error.log'), err.stack+'\n');
        }
        catch (e){
        }
    }
    console.log ('wylio stopped working');
    console.log ('check log files in '+settings.baseDir);
    process.exit (-1);
});
    
exports.addError = function (error){
    try{
        fs.appendFileSync (path.join (settings.baseDir, 'error.log'), error);
    }
    catch (e){
        try{
            fs.mkdirSync (settings.baseDir);
            fs.appendFileSync (path.join (settings.baseDir, 'error.log'), error);
        }
        catch (e){}
    }
}