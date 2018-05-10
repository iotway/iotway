const os = require ('os');
const path = require ('path');
const fs = require ('fs');

const homeDir = os.homedir();

if (!fs.existsSync (path.normalize (homeDir+'/.wylio'))){
    fs.mkdirSync (path.normalize (homeDir+'/.wylio'));
    fs.mkdirSync (path.normalize (homeDir+'/.wylio/profiles'));
}

const baseDir = path.normalize (homeDir+'/.wylio/');
const profilesDir = path.normalize (homeDir+'/.wylio/profiles/');
const profileFile = path.normalize (homeDir+'/.wylio/profile');

module.exports = {
    baseDir: baseDir,
    profilesDir: profilesDir,
    profileFile: profileFile,
    defaultProfileName: 'default.json',
    api: 'http://localhost:3000/api/v1'
};