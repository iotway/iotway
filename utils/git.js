const repo = 'https://github.com/iotway/projectTemplates.git';
const git = require('simple-git/promise');
const fs = require ('fs-extra');
const path = require ('path');

exports.downloadTemplate = async function (projectFolderPath) {
    await git (__dirname).clone (repo, projectFolderPath);
    try{
        fs.removeSync (path.join(projectFolderPath, '.git'));
    }
    catch (err){

    }
}