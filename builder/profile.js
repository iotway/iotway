const commands = ['select', 'save', 'delete', 'list'];
const _ = require ('lodash');
module.exports = function (yargs, handler){
    yargs.command('profile', 'Profile settings', 
     (yargs) =>{
        yargs.command ('select [profile_name]', 'select profile, default if none specifed', {}, handler.select)
        .command ('save <profile_name>', 'save profile', {
            // profile: {
            //     alias: 'p',
            //     default: 'default'
            // }
        }, handler.save)
        .command ('delete <profile_name>', 'delete profile', {}, handler.delete)
        .command ('list', 'list all profiles', {}, handler.list)
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