const profileService = require ('../service/profile');
const socketService = require ('../service/socket');
const productApi = require ('../utils/api').products;
const readline = require('readline');
exports.shell = async function (argv){
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
            process.stdin.setRawMode (true);
            process.stdin.setEncoding( 'utf8' );
            readline.emitKeypressEvents(process.stdin);
            process.stdin.on('keypress', (str, key) => {
                if (key.ctrl && key.name === 'q')
                    process.exit (0);
                else{
                    socketService.send ('packet', productId, {
                        t: 's',
                        d: {
                            a:'k',
                            t:str
                        }
                    });
                }
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