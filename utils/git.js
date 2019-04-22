let projectRepoUrl = 'https://github.com/grosuana/iotwayProjects/trunk/project_templates/';
let dockerRepoUrl = 'https://github.com/grosuana/iotwayProjects/trunk/docker/';
let libRepoUrl = 'https://github.com/grosuana/iotwayProjects/trunk/docker/libraries/';
let svn = require('node-svn-ultimate');
let secret = require('./secret');

exports.downloadTemplate = async function (language, projectFolder) {
    let dir = language.toString();
    return new Promise(function (resolve, reject) {

        svn.commands.export(projectRepoUrl + dir, projectFolder, { username: secret.username, password: secret.password, force:true }, function (err) {
            if (err) {
                console.log(err);
                reject(err);
        }
            else {

                //console.log("Checkout complete");
                resolve();
            }
        });

    });
}

exports.downloadDockerfile = async function (language, projectFolder) {
    let dir = language.toString();
    return new Promise(function (resolve, reject) {

        svn.commands.export(dockerRepoUrl + 'dockerfile', projectFolder, { username: secret.username, password: secret.password, force:true }, function (err) {
            if (err) {
                console.log(err);
                reject(err);
        }
            else {

                //console.log("Dockerfile complete");
                resolve();
            }
        });

    });
}

exports.downloadLibraries = async function (language, projectFolder) {
    let dir = language.toString();
    return new Promise(function (resolve, reject) {

        svn.commands.export(libRepoUrl + language, projectFolder, { username: secret.username, password: secret.password }, function (err) {
            if (err) {
                console.log(err);
                reject(err);
        }
            else {

                //console.log("Library complete");
                resolve();
            }
        });

    });
}