const socketio = require ('socket.io-client');
const settings = require ('../utils/settings');
const cookie = require('cookie');
const msgpack = require ('msgpack5')();
var axios = require ('axios');
let socket;
let authenticated = false;

exports.connect = async function (url, token, cb, packetcb){
    let socketUrl;
    socketUrl = 'ws'+url.substring(4);
    socketUrl = url;
    let data = await axios.get (url);
    let cookies = null;
    try
    {
        cookie.parse (data.headers['set-cookie'][0]);
    }
    catch (e)
    {

    }
    socket = socketio (socketUrl, {path: settings.socketPath, transports: ['polling'], extraHeaders: (cookies?{cookie:'server='+cookies.server}:null)});
    socket.on ('connect', ()=>{
        socket.emit ('authenticate', {
            token: token
        });
    });
    socket.on ('reconnect', ()=>{
        socket.emit ('authenticate', {
            token: token
        });
    });
    socket.on ('authenticate', (data)=>{
        authenticated = data.authenticated || false;
        cb ();
    });
    socket.on ('packet', (m)=>{
        let packet = msgpack.decode (new Buffer (m.data, 'base64'));
        packetcb (packet);
    });
    socket.on ('error', function (err)
    {
        console.error ('Connection error '+err.message);
    });
    socket.on ('disconnect', function ()
    {
        authenticated = false;
        console.log ('Disconnected');
    });
    return socket;
};

exports.send = function (tag, productId, data){
    if (socket && authenticated)
    {
        socket.emit (tag, {
            productId: productId, 
            data: msgpack.encode (data).toString ('base64')
        });
    }
    else
    {
        console.log ('Not authenticated.');
    }
};