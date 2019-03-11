module.exports = function (yargs, handler){
	yargs.command('remote <product_id> <remote_port> [host]', 'Open a remote connection to the device.', {
		port: {
			alias: 'p',
			type: 'number',
			desc: 'the local port to connect to',
			demandCommand: false,
			default: 7000
		}
	}, handler.remote)
		.help ()
		.demandCommand ();
	return yargs;
};