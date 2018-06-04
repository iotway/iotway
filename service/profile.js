const fs = require ('fs');
const settings = require ('../utils/settings');
const path = require ('path');
const error = require ('../utils/error');

exports.exists = function (name){
    let profiles = fs.readdirSync (settings.profilesDir);
    if (profiles.indexOf(name) != -1)
        return true;
    return false;
};

exports.getCurrentProfile = function (){
    let profileName = exports.getCurrentProfileName();
    try{
        let profile = require (path.normalize(settings.profilesDir + profileName));
        return {profile:profile, name:profileName};
    }
    catch (err){
        let token = (process.env.WYLIODRIN_TOKEN)? process.env.WYLIODRIN_TOKEN: undefined;
        let api = (process.env.WYLIODRIN_SERVER)? process.env.WYLIODRIN_SERVER: undefined;
        let username = (process.env.WYLIODRIN_USER)? process.env.WYLIODRIN_USER: undefined;
        return {profile:{
            token: token,
            api: api,
            username: username
        }, name:profileName};
    }
};

exports.getCurrentToken = function (){
    let profile = exports.getCurrentProfile();
    if (profile.profile.token)
        return profile.profile.token;
    return null;
};

exports.deleteTokenForCurrentProfile = function (){
    let profile = exports.getCurrentProfile ();
    profile.profile.token = "";
    fs.writeFileSync (path.normalize(settings.profilesDir + profile.name), JSON.stringify (profile.profile));
};

exports.saveTokenToCurrentProfile = function (token){
    let currentProfile = exports.getCurrentProfile();
    let profileName = currentProfile.name;
    let profileData = currentProfile.profile;
    profileData.token = token;
    fs.writeFileSync (settings.profilesDir+profileName, JSON.stringify(profileData));
};

exports.saveDataToCurrentProfile = function (username, token, endpoint){
    let profileName = exports.getCurrentProfileName();
    let data = {
        username: username,
        token: token,
        api: endpoint
    };

    fs.writeFileSync (settings.profilesDir+profileName, JSON.stringify(data));
}

exports.getCurrentProfileName = function (){
    let profileName;
    try{
        //Read current profile
        profileName = fs.readFileSync (settings.profileFile, 'utf8');
    }
    catch (err){
        //No current
        profileName = settings.defaultProfileName;
    }
    return profileName;
};