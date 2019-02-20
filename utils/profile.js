const fs = require ('fs');
const settings = require ('./settings');
const path = require ('path');

/**
 * 
 * @param {String} profileName 
 * @returns {String} fileName
 */
function filename(profileName){
    return profileName + '.json';
}

function profileName (profileFile){
    return profileFile.slice (0, -5);
}

exports.changeCurrentProfile = function (profileName){
    fs.writeFileSync (settings.profileFile, profileName);
};

exports.changeToDefault = function (){
    fs.writeFileSync (settings.profileFile, settings.defaultProfileName);
};

exports.deleteProfile = function (profileName){
    fs.unlinkSync (path.join(settings.profilesDir, filename (profileName)));
};

exports.exists = function (name){
    let profiles = fs.readdirSync (settings.profilesDir);
    if (profiles.indexOf(name) != -1)
        return true;
    return false;
};

exports.getCurrentProfile = function (){
    let profileName = exports.getCurrentProfileName();
    return exports.getProfile (profileName);
};

exports.getCurrentProfileName = function (){
    let profileName;
    try{
        //Read current profile
        profileName = fs.readFileSync (settings.profileFile, 'utf8');
    }
    catch (err){
        //No current profile
        profileName = settings.defaultProfileName;
    }
    return profileName;
};

exports.getProfile = function (profileName){
    try{
        let profile = require (path.join(settings.profilesDir, filename(profileName)));
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
}

exports.getProfiles = function (){
    let files = fs.readdirSync (settings.profilesDir);
    let profiles = [];
    for (let file of files){
        profiles.push (profileName (file));
    }
    return profiles;
}

exports.setCurrentProfile = function (profileName){
    fs.writeFileSync (settings.profileFile, profileName);
};

exports.storeProfileData = function (profileName, data){
    fs.writeFileSync(path.join(settings.profilesDir, filename(profileName)), JSON.stringify(data));
};
