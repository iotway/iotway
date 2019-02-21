const readlineSync = require('readline-sync');
let libiotway = require ('libiotway');

const nonce = require ('../utils/nonce');
const profileService = require ('../utils/profile');

module.exports.login = async function (argv){
    nonce.check (argv.nonce);
    nonce.add (argv.nonce);
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
        let currentProfile = profileService.getCurrentProfile().profile;
        if (currentProfile.api)
            host = currentProfile.api;
        else
            host = readlineSync.question ('host: ');
    }
    if (host.substring (0, 4) != 'http')
        host = 'https://'+host;
    libiotway = libiotway.init (host)
    usersApi = libiotway.users;
    let token = await usersApi.login ({
        username: username,
        password: password
    });

    if (token){
        let profileName = profileService.getCurrentProfileName();
        profileService.storeProfileData (profileName, {username: username, token: token, api: host});
    }
    else{
        console.error ('Log in failed');
        process.exit (-1);
    }
};

module.exports.logout = async function (argv){
    nonce.check (argv.nonce);
    nonce.add (argv.nonce);
    let usersApi = libiotway.get().users;
    if (usersApi){
        let result = await usersApi.logout();
        if (result){
            let currentProfile = profileService.getCurrentProfile();
            let currentProfileData = currentProfile.profile;
            if (currentProfileData.token)
                delete currentProfileData.token;
            if (currentProfileData.username)
                delete currentProfileData.username;
            profileService.storeProfileData (currentProfile.name, currentProfileData);
        }
        else{
            console.error ('Session expired. Log in or select different profile.');
            process.exit (-1);
        }
    }
    else{
        console.error ('No credentials. Please login or select a profile.');
        process.exit (-1);
    }
};