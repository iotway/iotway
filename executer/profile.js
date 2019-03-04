const Table = require ('cli-table');

const profileService = require ('../utils/profile');
const nonce = require ('../utils/nonce');

exports.delete = function (argv){
    nonce.check (argv.nonce);
    nonce.add (argv.nonce);
    let profileName = argv.profile_name;
    try{
        profileService.deleteProfile (profileName);
        if (profileService.getCurrentProfileName() === profileName){
            profileService.changeToDefault ()
            console.log ('Switched to default profile');
        }
    }
    catch (err){
        console.error ('No profile to delete.');
        process.exit (-1);
    }
};

exports.list = function (argv){
    nonce.check (argv.nonce);
    nonce.add (argv.nonce);
    let table = new Table({
        head: ['Profile', 'Username', 'Server', 'Selected'],
    });
    let currentProfileName = profileService.getCurrentProfileName();
    let existingProfilesNames = profileService.getProfiles();
    let profilesJson = [];
    let foundSelectedProfile = false;
    for (let profileName of existingProfilesNames){
        let profile = profileService.getProfile (profileName).profile;
        let username = (profile.username)? profile.username: '';
        let api = (profile.api)? profile.api: '';
        if (argv.o === 'json'){
            if (currentProfileName === profileName){
                profile.selected = true;  
                foundSelectedProfile = true;
            }
            profilesJson.push (currentProfile);
        }
        else {
            if (currentProfileName === profileName){
                table.push ([profileName, username, api, '*']);
                foundSelectedProfile = true;
            }
            else
                table.push ([profileName, username, api, '']);
        }
    }
    if (!foundSelectedProfile){
        table.push ([currentProfileName, '', '', '*']);
    }
    if (argv.o != 'json')
        console.log (table.toString());
    else
        console.log (JSON.stringify (profilesJson, null, 3));
};

exports.save = function (argv){
    nonce.check (argv.nonce);
    nonce.add (argv.nonce);
    let profileName = argv.profile_name;
    let currentProfile = profileService.getCurrentProfile().profile;
    profileService.storeProfileData (profileName, currentProfile);
    profileService.setCurrentProfile (profileName);
};

exports.select = function (argv){
    nonce.check (argv.nonce);
    nonce.add (argv.nonce);
    let profileName = argv.profile_name;
    //Check which profile to be selected.
    if (profileName === undefined){
        profileName = settings.defaultProfileName;
    }
    //Check if profile name is legal.
    if (profileName.indexOf ('/') === -1){
        //Check profile exists
        if (profileService.exists (profileName)){
            profileService.changeCurrentProfile (profileName);
        }
        else{
            console.error ('Profile does not exist.');
            process.exit (-1);
        }
    }
    else{
        console.error ('Invalid profile name');
        process.exit (-1);
    }
};