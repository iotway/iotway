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
    if (profileName.indexOf ('/') === -1){
        try{
            fs.writeFileSync (settings.profileFile, profileName);
        }
        catch(err){
            console.error ('Could not select profile.');
            return errors.EDIT_PROFILE;
        }
    }
    else{
        console.error ('Invalid profile name');
        return errors.INVALID_DATA;
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
    }
};

exports.list = function (argv){
    let table = new Table({
        head: ['Profiles', 'Selected'],
    });
    let selectedProfile = profileService.getCurrentProfileName();
    let files = fs.readdirSync (settings.profilesDir);
    if (files.length === 0 && selectedProfile){
        let profile = selectedProfile.substr (0, selectedProfile.length-5);
        table.push ([profile, '    *']);
    }
    else{
        for (file of files){
            let profile = file.substr (0, file.length-5);
            if (file === selectedProfile)
                table.push ([profile, '    *']);
            else
                table.push ([profile, '']);
        }
    }
    console.log (table.toString());
}