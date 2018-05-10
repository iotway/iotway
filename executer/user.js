const readlineSync = require('readline-sync');
const profileService = require ('../service/profile');
const fs = require ('fs');
const error = require ('../utils/error');
const usersApi = require ('../utils/api').users;

module.exports.login = async function (argv){
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

module.exports.logout = async function (argv){
    let result = await usersApi.logout();
    if (result){
        profileService.deleteTokenForCurrentProfile();
    }
    else{
        console.error ('No token. Log in or select profile.');
        process.exit (-1);
    }
}