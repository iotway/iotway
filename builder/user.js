const commands = ['login', 'logout'];
const _ = require ('lodash');
module.exports = function (yargs, handler){
    yargs.command ('user', 'User settings', 
     (yargs) =>{
        yargs.command ('login', 'login', {
            username: {
                alias: 'u',
                type: 'string',
                demandOption: false
            },
            password: {
                alias: 'p',
                type: 'string',
                demandOption: false
            }       
        }, handler.login)
        .command ('logout', 'logout', {}, handler.logout)
        .check ((argv)=>{
            if (_.indexOf (commands, argv._[1]) != -1)
                return true;
            throw new Error ('Invalid command.');
        })
        .help ()
        .demandCommand ();
     });
    return yargs;
};