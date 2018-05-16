const readlineSync = require('readline-sync');
const profileService = require ('../service/profile');
const fs = require ('fs');
const error = require ('../utils/error');
const child_process = require ('child_process');
let usersApi = require ('../utils/api').users;
let settingsApi = require ('../utils/api').settings;
let api = require ('../utils/api');

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
        let settings = await settingsApi.get ();
        if (settings){
            try{
                child_process.execSync ('docker login ' + settings.REPOSITORY + ' -u ' + username + ' -p ' + password);
            }
            catch (err){
                console.error (err.message);
                console.error ('Could not run docker login command. Make sure docker is installed.');
                console.error ('Publishing applications do not work.');
                process.exit (-1);
            }
        }
    }
    else{
        console.error ('Log in failed');
        process.exit (-1);
    }
};

module.exports.logout = async function (argv){
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