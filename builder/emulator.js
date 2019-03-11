//const commands = ['images', 'platform', 'update', 'list', 'new', 'provision', 'run', 'delete'];
module.exports = function (yargs, handler){
	yargs.command(['emulator', 'e'], 'Manage product emulator (requires qemu)', (yargs) => {
		yargs.command (['images', 'i'], 'List emulator images', {
			format: {
				alias: 'f',
				type: 'array',
				desc: 'Specify output format. Wide (contains all fields), or specify each field.',
				choices: ['wide', 'platform', 'version', 'machine', 'cpu', 'cmdline', 'mem', 'hda', 'kernel', 'dtb']
			}
		}, handler.images);
		yargs.command (['list', 'l'], 'List emulators', {
			format: {
				alias: 'f',
				type: 'array',
				desc: 'Specify output format. Wide (contains all fields), or specify each field.',
				choices: ['wide', 'platform', 'version', 'machine', 'cpu', 'cmdline', 'mem', 'hda', 'kernel', 'dtb']
			}
		}, handler.list);
		yargs.command (['platforms', 'p'], 'List available emulator platforms', {
			format: {
				alias: 'f',
				type: 'array',
				desc: 'Specify output format. Wide (contains all fields), or specify each field.',
				choices: ['wide', 'platform', 'version', 'machine', 'cpu', 'cmdline', 'mem', 'link']
			}
		}, handler.platforms);
		yargs.command (['update <platform>', 'u'], 'Update emulator image for a platform (all for all platforms)', {
		}, handler.update);
		yargs.command (['new <clusterId> <productId> [type]', 'n'], 'Make a new emulator', {
			
		}, handler.newEmulator);
		yargs.command (['run <productId>', 'r'], 'Run an emulator', {
			
		}, handler.runEmulator);
		yargs.command (['provision <filename>', 'pr'], 'Make a new emulator based on a provisioning file', {

		}, handler.platforms);
		yargs.command (['delete <productId>', 'd'], 'Delete an emulator', {

		}, handler.delEmulator)
			.help ()
			.demandCommand ();
	}, handler.provisionEmulator);
	return yargs;
};