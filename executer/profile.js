const fs = require ('fs');
const errors = require ('../utils/error');
const Table = require ('cli-table');
const settings = require ('../utils/settings');
const path = require ('path');
const profileService = require ('../service/profile');

exports.select = function (argv){
    let profileName = argv.profile_name + '.json';
    //Check which profile to be selected.
    if (profileName === undefined){
        profileName = settings.defaultProfileName;
    }
    //Check if profile name is legal.
    if (profileService.exists (profileName)){
        try{
            profileService.get
            fs.writeFileSync (settings.profileFile, profileName);
        }
        catch(err){
            console.error ('Could not select profile.');
            process.exit (-1);
        }
    }
    else{
        console.error ('Profile does not exist.');
        process.exit (-1);
    }
};

exports.save = function (argv){
    let profileName = argv.profile_name+'.json';
    let currentProfile = profileService.getCurrentProfile();
    let profileData = currentProfile.profile;
    fs.writeFileSync(path.normalize(settings.profilesDir + profileName), JSON.stringify(profileData));
    fs.writeFileSync (settings.profileFile, profileName);
};

exports.delete = function (argv){
    let profileName = argv.profile_name + '.json';
    try{
        fs.unlinkSync (path.normalize(settings.profilesDir + profileName));
        if (profileService.getCurrentProfileName() === profileName){
            fs.writeFileSync (settings.profileFile, settings.defaultProfileName);
            console.log ('Switched to default profile');
        }
    }
    catch (err){
        console.error ('No profile to delete.');
        process.exit (-1);
    }
};

exports.list = function (argv){
    let table = new Table({
        head: ['Profile', 'Username', 'Server', 'Selected'],
    });
    let selectedProfile = profileService.getCurrentProfileName();
    let files = fs.readdirSync (settings.profilesDir);
    let profilesJson = [];
    if (files.length === 0 && selectedProfile){
        let profile = selectedProfile.substr (0, selectedProfile.length-5);
        table.push ([profile, '', '', '*']);
    }
    else{
        for (file of files){
            let currentProfile = JSON.parse(fs.readFileSync (settings.profilesDir + file));
            let profile = file.substr (0, file.length-5);
            let username = (currentProfile.username)? currentProfile.username: '';
            let api = (currentProfile.api)? currentProfile.api: '';
            if (argv.f === 'json'){
                currentProfile.name = profile;
                if (file === selectedProfile){
                    currentProfile.selected = true;
                    
                }
                profilesJson.push (currentProfile);
            }
            else {
                if (file === selectedProfile)
                    table.push ([profile, username, api, '*']);
                else
                    table.push ([profile, username, api, '']);
            }
        }
    }
    if (argv.f != 'json')
        console.log (table.toString());
    else
        console.log (JSON.stringify (profilesJson, null, 3));
}