const os = require ('os');
const path = require ('path');
const fs = require ('fs');

const homeDir = os.homedir();
const settingsDirName = '.iotway';

const settingsDir = path.join (homeDir, settingsDirName);
const profilesDir = path.join (settingsDir, 'profiles');
const profileFile = path.join (settingsDir, 'profile');
const errorFile = path.join (settingsDir, 'error.log');

if (!fs.existsSync (settingsDir)){
    fs.mkdirSync (settingsDir);
    fs.mkdirSync (profilesDir);
}

module.exports = {
    settingsDir: settingsDir,
    profilesDir: profilesDir,
    profileFile: profileFile,
    errorFile: errorFile,
    defaultProfileName: 'default',
    socketPath: '/socket/ui',
    executor: 'iotway'
};