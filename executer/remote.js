const profileService = require ('../utils/profile');
const socketService = require ('../utils/socket');
const productApi = require ('../api').get().products;
//const readline = require('readline');
const nonce = require ('../utils/nonce');
const net = require('net');
var shortid = require ('shortid');

var network = {};

var online = false;

var setup = null;

exports.remote = async function (argv){
	nonce.check (argv.nonce);
	nonce.add (argv.nonce);
	let productId = argv.product_id;
	if (productApi){
		let product = await productApi.get (productId);
		if (product){
			let profile = profileService.getCurrentProfile().profile;
			socketService.connect (profile.api, profile.token, ()=>{
				console.log ('Press Ctrl+q to exit remote.');
				// process.stdin.setRawMode (true);
				// process.stdin.setEncoding( 'utf8' );
				// readline.emitKeypressEvents(process.stdin);
				// process.stdin.on('keypress', (str, key) => {
				//     //console.log ('key'); console.log (key); console.log (str);
				//     if (key.ctrl && key.name === 'q'){
				//         console.log ('');
				//         console.log ('Disconnected');
				//         process.exit (0);
				//     }
				// });
				console.log ('Pinging device...');
				/*let timer = */setTimeout (function (){
					if (!online){
						console.error ('Ping timeout. Device offline.');
						process.exit (-1);
					}
				}, 10000);
				socketService.send ('packet', product.productId, {
					t: 'ping',
					d: null
				});
				setup = () => {
					const server = net.createServer((c) => {
						// 'connection' listener
						var id = shortid.generate ();
						if (network[id]) network[id].link.end ();
						network[id] = {
							link: c,
							timeout: setTimeout (() => {
								console.log ('Link id '+id+' establish timeout');
								c.end ();
							}, 60*1000)
						};
						console.log('New link request with id '+id);
						socketService.send ('packet', product.productId, {
							t:'remote',
							d: {
								a:'connect',
								id: id,
								port: argv.remote_port,
								host: argv.host
							}
						});
						c.on('data', function (data) {
							socketService.send ('packet', product.productId, {
								t:'remote',
								d: {
									a:'d',
									id: id,
									d: data
								}
							});
						});
						c.on ('error', function (err)
						{
							console.log ('Link '+id+' error: '+err.message+', sending disconnect');
							socketService.send ('packet', product.productId, {
								t:'remote',
								d: {
									a:'disconnect',
									id: id
								}
							});
						});
						c.on('end', function () {
							socketService.send ('packet', product.productId, {
								t:'remote',
								d: {
									a:'disconnect',
									id: id
								}
							});
							console.log('Link '+id+' disconnected');
							clearTimeout (network[id].timeout);
							delete network[id];
						});
					});
					server.on('error', (err) => {
						throw err;
					});
					server.listen(argv.port, () => {
						console.log('Server bound to port '+argv.port+', link to '+(argv.host?argv.host:'127.0.0.1')+':'+argv.remote_port);
					});
				};
			}, (data)=>{
				// console.log (data);
				if (data.t === 'pong')
				{
					online = true;
					setup ();
				}
				else
				if (data.t === 'remote' && data.d && data.d.id)
				{
					if (network[data.d.id] && network[data.d.id].link)
					{ 
						if (data.d.a === 'd')
						{
							network[data.d.id].link.write (data.d.d);  
						}
						else
						if (data.d.a === 'error')
						{
							console.log ('Link id '+data.d.id+' error: '+data.d.e);
							network[data.d.id].link.end ();
						}
						else
						if (data.d.a === 'connected')
						{
							clearTimeout (network[data.d.id].timeout);
							console.log ('Link id '+data.d.id+' connected');
						}
						else
						if (data.d.a === 'disconnect')
						{
							console.log ('Link id '+data.d.id+' disconnected');
							network[data.d.id].link.end ();
						}
					}
					else
					{
						console.log ('There is no link for id '+data.d.id);
					}
				}
			});
		}
		else{
			process.exit (-1);
		}
	}
	else {
		console.error ('No session. Please login or select a different profile.');
		process.exit (-1);
	}
};