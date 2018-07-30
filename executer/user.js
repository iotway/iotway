const readlineSync = require('readline-sync');
const profileService = require ('../service/profile');
let usersApi = require ('../utils/api').users;
let api = require ('../utils/api');
const nonce = require ('../utils/nonce');

module.exports.login = async function (argv){
    nonce.check (argv.nonce);
    let username = argv.username;
    let password = argv.password;
    let host = argv.host;
    if (username === undefined){
        username = readlineSync.question ('username: ');
    }
    if (password === undefined){
        password = readlineSync.question ('password: ',{hideEchoBack:true});
    }
    if (host === undefined){
        host = readlineSync.question ('host: ');
    }
    if (host.substring (0, 4) != 'http')
        host = 'https://'+host;
    api = api.init (host);
    usersApi = api.users;
    settingsApi = api.settings;
    let token = await usersApi.login ({
        username: username,
        password: password
    });

    if (token){
        profileService.saveDataToCurrentProfile (username, token, host);
    }
    else{
        console.error ('Log in failed');
        process.exit (-1);
    }
};

module.exports.logout = async function (){
    if (usersApi){
        let result = await usersApi.logout();
        if (result){
            profileService.deleteTokenForCurrentProfile();
        }
        else{
            console.error ('No token. Log in or select profile.');
            process.exit (-1);
        }
    }
    else{
        console.error ('No credentials. Please login or select a profile.');
        process.exit (-1);
    }
}