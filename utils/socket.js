const WebSocket = require('ws');
const msgpack = require ('msgpack5')();
let socket;
let authenticated = false;

exports.connect = function (url, token, cb, packetcb){
	let socketUrl;
	socketUrl = 'ws'+url.substring(4)+'/socket/ui';
	socket = new WebSocket(socketUrl);
	socket.on('open', function open() {
		socket.send (JSON.stringify({t:'a', token:token}));
	});
	socket.on ('error', function (err)
	{
		console.error ('Connection error '+err.message);
	});
	socket.on ('close', function ()
	{
		authenticated = false;
		console.log ('Disconnected');
	});
	socket.on ('message', function (data){
		data = JSON.parse (data);
		if (data.t === 'a')
		{
			if (data.authenticated === true) authenticated = true;
			cb ();
		}
		else
		if (data.t === 'p')
		{
			let packet = msgpack.decode (new Buffer(data.data, 'base64'));
			packetcb (packet);
		}
	});
	return socket;
};

exports.send = function (tag, productId, data){
	if (socket && authenticated)
	{
		socket.send (JSON.stringify({
			t: 'p',
			productId: productId, 
			data: msgpack.encode (data).toString ('base64')
		})) ;
	}
	else
	{
		console.log ('Not authenticated.');
	}
};