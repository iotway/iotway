const commands = ['select', 'save', 'delete', 'list'];
const _ = require ('lodash');
module.exports = function (yargs, handler){
	yargs.command('profile', 'Profile settings.', 
	 (yargs) =>{
			yargs.command ('select [profile_name]', 'Select profile, default if none specifed.', {}, handler.select)
				.command ('save <profile_name>', 'Save profile.', {}, handler.save)
				.command ('delete <profile_name>', 'Delete profile.', {}, handler.delete)
				.command ('list', 'List all profiles.', {
					format: {
						alias: 'f',
						type: 'array',
						desc: 'Specify output format. Wide (contains all fields), or specify each field.',
						choices: ['wide']
					}
				}, handler.list)
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