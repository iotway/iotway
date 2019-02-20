const profileService = require ('../service/profile');
const socketService = require ('../service/socket');
const productApi = require ('../utils/api').products;
const readline = require('readline');
const nonce = require ('../utils/nonce');

exports.shell = async function (argv){
    nonce.check (argv.nonce);
    nonce.add (argv.nonce);
    let productId = argv.product_id;
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
            console.log ('Press Ctrl+q to exit the shell.')
            process.stdin.setRawMode (true);
            process.stdin.setEncoding( 'utf8' );
            readline.emitKeypressEvents(process.stdin);
            process.stdin.on('keypress', (str, key) => {
                //console.log ('key'); console.log (key); console.log (str);
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
                                r: process.stdout.rows
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
    else{
        process.exit (-1);
    }
}