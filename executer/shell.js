const profileService = require ('../utils/profile');
const socketService = require ('../utils/socket');
const productApi = require ('libiotway').get().products;
const readline = require('readline');
const nonce = require ('../utils/nonce');
const errorFile = require ('../utils/settings').errorFile;
const error = require ('../utils/error');

exports.shell = async function (argv){
	nonce.check (argv.nonce);
	nonce.add (argv.nonce);
	let productId = argv.product_id;
	try{
		let product = await productApi.get (productId);
		if (product){
			let profile = profileService.getCurrentProfile().profile;
			socketService.connect (profile.api, profile.token, ()=>{
				socketService.send ('packet', productId, {
					t: 's',
					d: {
						a: 'r',
						c: process.stdout.columns,
						r: process.stdout.rows
					}
				});
				console.log ('Press any key to start the shell.');
				console.log ('Press Ctrl+q to exit the shell.');
				process.stdin.setRawMode (true);
				process.stdin.setEncoding( 'utf8' );
				readline.emitKeypressEvents(process.stdin);
				process.stdin.on('keypress', (str, key) => {
					if (key.ctrl && key.name === 'q'){
						console.log ('');
						console.log ('Disconnected');
						process.exit (0);
					}
					else{
						socketService.send ('packet', productId, {
							t: 's',
							d: {
								a:'k',
								t:key.sequence
							}
						});
					}
				});
				process.stdout.on('resize', function() {
					socketService.send ('packet', productId, {
						t: 's',
						d: {
							a: 'r',
							c: process.stdout.columns,
							r: process.stdout.rows
						}
					});
				});
			}, (data)=>{
				if (data.t === 's'){
					if (data.d.a === 'e'){
						if (data.d.e === 'noshell'){
							socketService.send ('packet', productId, {
								t: 's',
								d: {
									a: 'o',
									c: process.stdout.columns,
									r: process.stdout.rowsHe
								}
							});
						}
					}
					else if (data.d.a === 'k'){
						process.stdout.write (data.d.t);
					}
				}
			});
		}
	}
	catch(err){
		console.error ('Could not get product. Check ' + errorFile + ' file for more details.');
		error.addError (err);
		process.exit (-1);
	}
};