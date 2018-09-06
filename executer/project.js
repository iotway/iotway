const appApi = require ('../utils/api').apps;
const productApi = require ('../utils/api').products;
const settingsApi = require ('../utils/api').settings;
const projectApi = require ('../utils/api').projects;
const userApi = require ('../utils/api').users;
const profileService = require ('../service/profile');
const tableBuilder = require ('../utils/table');
const Table = require ('cli-table');
const fs = require ('fs-extra');
const path = require ('path');
const mustache = require ('mustache');
const child_process = require ('child_process');
const socketService = require ('../service/socket');
const readline = require('readline');
const readlineSync = require('readline-sync');
const semver = require('semver');
const _ = require ('lodash');
const nonce = require ('../utils/nonce');
const errors = require ('../utils/error');
const projectService = require ('../service/project');

const projectLanguages = projectService.languages;

function print (data, prefix, channel){
    let lines = data.toString().split ('\n');
    if (lines[lines.length-1] === '\n'){
        lines.splice (lines.length-1, 1);
    }
    for (let l of lines){
        if (l.length > 0)
            channel.write (prefix+'> '+l+'\n');
    }
}

function normalizeProjectName (name){
    //parse project name and delete all illegal characters
    name = name.toLowerCase();
    let chars = name.split ('');
    chars = _.map (chars, (c)=>{
        if (c.toLowerCase() !== c.toUpperCase())
            return c;
        return '_';
    });
    return chars.join('');
}

exports.init = async function (argv){
    nonce.check (argv.nonce);
    nonce.add (argv.nonce);
    let contents = fs.readdirSync (process.cwd());
    if (contents.length === 0 || (contents.length === 1 && contents[0] === 'project.log')){
        let project;
        if (process.env.WYLIODRIN_PROJECT_ID){
            console.log ('Using environment configurations');
            let onlineProject = await projectApi.get (process.env.WYLIODRIN_PROJECT_ID);
            if (onlineProject){
                project = {
                    name: normalizeProjectName (onlineProject.name),
                    appId: onlineProject.appId,
                    language: projectLanguages[onlineProject.language],
                    id: onlineProject.projectId,
                    platform: onlineProject.platform,
                    ui: onlineProject.ui
                };
                try{
                    fs.writeFileSync (path.join(process.cwd(), 'wylioproject.json'), JSON.stringify(project, null, 3));
                }
                catch (e){
                    errors.addError (e.message);
                    console.error ('filesystem error.');
                }
            }
            else{
                console.error ('Project not found.');
                process.exit (-1);
            }
        }
        else{
            let projectName = argv.name;
            let projectPlatform = argv.platform;
            let projectAppId = argv.appId;
            let projectUi = argv.ui;
            let projectLanguage = argv.language;

            if (projectName === undefined || projectName.length === 0)
                projectName = readlineSync.question ('project name: '); 
            
            if (projectName.length === 0)
                process.exit (-1);
            
            projectName = normalizeProjectName (projectName);

            if (projectPlatform === undefined){
                if (settingsApi){
                    let settings = await settingsApi.get();
                    if (settings){
                        let platforms = Object.keys(settings.PLATFORM);
                        projectPlatform = readlineSync.question ('platform (choose between ' + platforms.join() + '): ');
                    }
                    else{
                        projectPlatform = readlineSync.question ('platform (log in or check website for supported platforms): ');
                    }
                }
                else{
                    projectPlatform = readlineSync.question ('platform (log in or check website for supported platforms): ');
                }
            }
            if (projectLanguage === undefined){
                projectLanguage = readlineSync.question ('project language (choose between '+Object.keys(projectService.languages).join()+'): ');
            }
            project = {
                name: projectName,
                appId: projectAppId,
                language: projectLanguages[projectLanguage],
                platform: projectPlatform,
                ui: projectUi
            };
        }
        if (project.appId.substring (0, 5) !== 'local'){
            if (appApi){
                let app = await appApi.get (project.appId);
                if (!app){
                    console.error ('Please provide a valid application id.');
                    process.exit (-1);
                }
            }
        }
        //Generate project structure
        fs.writeFileSync (path.join(process.cwd(), 'wylioproject.json'), JSON.stringify(project, null, 3));
        fs.copySync(path.normalize (__dirname + '/../utils/project_templates/' + project.language),
                                process.cwd());
        //Generate package.json for js projects
        if (project.language === 'nodejs'){
            let user = {
                email: '',
                name: ''
            };
            if (userApi){
                let onlineUser = await userApi.get ();
                if (onlineUser){
                    user = onlineUser;
                }
            }
            let package = fs.readFileSync (path.normalize (__dirname + '/../utils/project_templates/package.json'), 'utf8');
            let packageData = {
                project: project,
                user: user
            }
            package = mustache.render (package, packageData);
            fs.writeFileSync (path.join(process.cwd(), 'package.json'), package);
        }
    }
    else{
        console.log ('Folder not empty. Please run command in an empty folder.');
    }
};

function build(projectSettings, settings, appId, version, sessionId, productId, cb){
    //Run make
    console.log ('make');
    let make = child_process.spawn ('make', {
        env: _.assign ({}, process.env, settings.PLATFORM[projectSettings.platform].options)
    });
    make.stdout.on ('data', (data)=>{
        print (data, 'MAKE', process.stdout);
    });
    make.stderr.on ('data', (data)=>{
        print (data, 'MAKE', process.stderr);
    })
    make.on ('exit', async (code)=>{
        if (code === 0){
            await projectApi.build (projectSettings.id);
            if (productId && settings.PLATFORM[projectSettings.platform].options && settings.PLATFORM[projectSettings.platform].options.binary){
                let options = settings.PLATFORM[projectSettings.platform].options.binary;
                let newFile = path.join (path.dirname (options), productId + path.extname (options));
                try{
                    fs.copySync (path.join (process.cwd(), options), path.join (process.cwd(), newFile));
                    if (sessionId && projectSettings.id){
                        await productApi.run ({
                            session: sessionId,
                            productId: productId,
                            projectId: projectSettings.id
                        });
                    }
                }
                catch (e){
                    console.log ('Build error. ');
                    errors.addError (e.message);
                    process.exit (-1);
                }
            }
        }
        if (code === 0 && settings.PLATFORM[projectSettings.platform].docker.platform !== 'none'){
            //Generate dockerfile
            let docker = fs.readFileSync (path.join (process.cwd(), 'dockerfile'), 'utf8');
            let dockerFile;
            if (docker.substring (0, 7) != '#MANUAL'){
                let libraries = fs.readFileSync (path.normalize (__dirname + '/../utils/docker/libraries/' + projectSettings.language), 'utf8');
                let dockerData = {
                    REPOSITORY: settings.REPOSITORY,
                    DEPLOYER_DOMAIN: settings.DEPLOYER,
                    project: projectSettings,
                    arm: (settings.PLATFORM[projectSettings.platform].docker.platform === 'arm')? true: false,
                    dockerfile: docker,
                    libraries: libraries
                }
                let dockerTemplate = fs.readFileSync (path.normalize (__dirname + '/../utils/docker/project_template'), 'utf8');
                dockerFile = mustache.render (dockerTemplate, dockerData);
            }
            else{
                dockerFile = docker;
            }
            let buildFolder = path.join(process.cwd(), 'build');
            fs.writeFileSync (path.join(buildFolder, 'dockerfile'), dockerFile);
            // Build docker image
            console.log ('Building docker image.');
            let dockerBuild = child_process.spawn ('docker', ['build', '-t', settings.REPOSITORY+'/'+appId+':'+version, '.'], {cwd: buildFolder});
            dockerBuild.stdout.on ('data', (data)=>{
                print (data, 'DOCKER BUILD', process.stdout);
            });
            dockerBuild.stderr.on ('data', (data)=>{
                print (data, 'DOCKER BUILD', process.stderr);
            });
            dockerBuild.on ('exit', (code)=>{
                cb (code);
            });
        }
        else{
            process.exit (code);
        }
    });
}

async function publish (profile, settings, appId, version, semanticVersion, description, cb){
    if (settings.PLATFORM[projectSettings.platform].docker.platform !== 'none'){
        let buildFolder = path.join(process.cwd(), 'build');
        //Push docker image
        console.log ('Pushing docker image. Please wait.');
        let dockerPush = child_process.spawn ('docker', ['push', settings.REPOSITORY+'/'+appId+':'+version], {cwd: buildFolder});

        dockerPush.stdout.on ('data', (data)=>{
            print (data, 'DOCKER PUSH', process.stdout);
        });
        dockerPush.stderr.on ('data', (data)=>{
            print (data, 'DOCKER PUSH', process.stderr);
        });
        dockerPush.on ('exit', async (code)=>{
            if (semanticVersion === undefined){
                let projectSettings = await getProjectSettings (process.cwd());
                if (projectSettings.language === 'nodejs'){
                    let packagePath = path.join(process.cwd(), 'package.json');
                    try{
                        let projectData = require (packagePath);
                        let projectVersion = projectData.version;
                        if (projectVersion)
                            semanticVersion = semver.valid (semver.coerce (projectVersion));
                    }
                    catch (e){
                        semanticVersion = undefined;
                    }
                }
            }
            if (appApi){
                await appApi.versions (appId);
                await appApi.editVersion (appId, version, {
                    semver: semanticVersion,
                    text: description
                });
            }
            else{
                console.error ('No credentials. Please login or select a profile.');
                process.exit (-1);
            }
            cb (code);
        });
    }
    else cb(0);
}

async function publishDev (profile, settings, appId, version, cb){
    let buildFolder = path.join(process.cwd(), 'build');
    //Push docker image

    console.log ('Pushing docker image. Please wait.');
    let dockerPush = child_process.spawn ('docker', ['push', settings.REPOSITORY+'/'+appId+':'+version], {cwd: buildFolder});

    dockerPush.stdout.on ('data', (data)=>{
        print (data, 'DOCKER PUSH', process.stdout);
    });
    dockerPush.stderr.on ('data', (data)=>{
        print (data, 'DOCKER PUSH', process.stderr);
    });
    dockerPush.on ('exit', async (code)=>{
        cb (code);
    });
}

function dockerLogin (settings, profile, cb){
    let dockerLogin = child_process.spawn ('docker', ['login', settings.REPOSITORY, '-u', profile.username, '-p', profile.token]);
    dockerLogin.stdout.on ('data', (data)=>{
        print (data, 'DOCKER LOGIN', process.stdout);
    });
    dockerLogin.stderr.on ('data', (data)=>{
        print (data, 'DOCKER LOGIN', process.stderr);
    });
    dockerLogin.on ('exit', (code)=>{
        cb (code);
    });
}

async function checkVersion (appId, version){
    let versions = await appApi.versions (appId);
    if (versions && versions.length === 0){
        let max = Math.max (...versions);
        return version > max;
    }
    return false;
}

function searchSettings (myPath){

    let files = fs.readdirSync (myPath);
    if (files.indexOf('wylioproject.json') != -1)
        return fs.readFileSync (path.join (myPath, 'wylioproject.json'), 'utf8');
    else if (myPath === path.join (myPath, '..'))
        return null;
    else
        return searchSettings (path.join (myPath, '..'));
}

async function getProjectSettings (sourceFolder){
    try{
        let tempProjectSettings = searchSettings (sourceFolder);
        tempProjectSettings = JSON.parse (tempProjectSettings);
        if (tempProjectSettings.id){
            projectSettings = await projectApi.get (tempProjectSettings.id);
            if (!projectSettings){
                projectSettings = tempProjectSettings;
            }
            else{
                fs.writeFileSync (path.join(process.cwd(), 'wylioproject.json'), JSON.stringify(projectSettings));
            }
        }
        else{
            projectSettings = tempProjectSettings;
        }
        return projectSettings;
    }
    catch (e){
        console.error (e.message)
        console.error ('Could not parse project settings file.');
        console.error ('Run wylio project init.');
        process.exit (-1);
    }
}

exports.edit = async function  (argv){
    nonce.check (argv.nonce);
    nonce.add (argv.nonce);
    let projectSettings = await getProjectSettings(process.cwd());
    if (argv.name){
        projectSettings.name = argv.name;
    }
    if (argv.platform){
        projectSettings.platform = argv.platform;
    }
    if (argv.appId){
        projectSettings.appId = argv.appId;
    }
    if (argv.id){
        projectSettings.id = argv.id;
    }
    if (argv.ui){
        projectSettings.ui = argv.ui;
    }
    fs.writeFileSync (path.join(process.cwd(), 'wylioproject.json'), JSON.stringify(projectSettings));
    console.log ('Project updated successfully.');
};

exports.build = async function (argv){
    nonce.check (argv.nonce);
    nonce.add (argv.nonce);
    let profile = profileService.getCurrentProfile().profile;
    let version = argv.application_version;
    let projectSettings;
    if (process.env.WYLIODRIN_PROJECT_ID){
        console.log ('Using environment configurations');
        let onlineProject = await projectApi.get (process.env.WYLIODRIN_PROJECT_ID);
        if (onlineProject){
            projectSettings = {
                name: onlineProject.name,
                appId: onlineProject.appId,
                language: projectLanguages[onlineProject.language],
                id: onlineProject.projectId,
                platform: onlineProject.platform,
                ui: onlineProject.ui
            };
        }
        else{
            console.error ('Cannot get project.');
            process.exit (-1);
        }
    }
    else{
        projectSettings = await getProjectSettings(process.cwd());
    }
    if (!version){
        version = 'dev';
    }
    else if (projectSettings.appId.substring (0, 5) !== 'local' && !await checkVersion (projectSettings.appId, version)){
        console.log ('The provided version is less or equal to the latest published version.');
        console.log ('The Docker image will be created but it cannot be published.');
    }
    let settings = await settingsApi.get ();
    if (settings){
        if (settings.PLATFORM[projectSettings.platform].docker.platform === 'none'){
            build (projectSettings, settings, projectSettings.appId, version, undefined, undefined, (code)=>{
                //Docker logout
                child_process.spawn ('docker', ['logout', settings.REPOSITORY]);
                process.exit (code);
            });
        }
        else{
            //Run docker login
            dockerLogin (settings, profile, (code)=>{
                if (code === 0){
                    build (projectSettings, settings, projectSettings.appId, version, undefined, undefined, (code)=>{
                        //Docker logout
                        child_process.spawn ('docker', ['logout', settings.REPOSITORY]);
                        process.exit (code);
                    });
                }
                else{
                    process.exit (code);
                }
            });
            }
    }
    else{
        console.error ('Could not get account settings.');
        process.exit (-1);
    }
};

exports.publish = async function (argv){
    nonce.check (argv.nonce);
    nonce.add (argv.nonce);
    let profile = profileService.getCurrentProfile().profile;
    let version = argv.application_version;
    let description = (argv.description)? argv.description: "";
    let semanticVersion = argv["project-version"];
    let projectSettings;
    if (process.env.WYLIODRIN_PROJECT_ID){
        console.log ('Using environment configurations');
        let onlineProject = await projectApi.get (process.env.WYLIODRIN_PROJECT_ID);
        if (onlineProject){
            projectSettings = {
                name: onlineProject.name,
                appId: onlineProject.appId,
                language: projectLanguages[onlineProject.language],
                id: onlineProject.projectId,
                platform: onlineProject.platform,
                ui: onlineProject.ui
            };
        }
        else{
            console.error ('Cannot get project.');
            process.exit (-1);
        }
    }
    else{
        projectSettings = await getProjectSettings(process.cwd());
    }
    if (!await checkVersion (projectSettings.appId, version)){
        console.error ('The provided version is less or equal to the latest published version.');
        console.error ('Cannot publish docker image.');
        process.exit (-1);
    }
    let settings = await settingsApi.get ();
    if (settings){
        let appId = projectSettings.appId;
        if (appId.substring (0, 5) === 'local'){
            console.error ('This project has no application assigned.');
            process.exit (-1);
        }
        app = await appApi.get (appId);
        if (!app){
            console.error ('Please provide an existing application id.');
            process.exit (-1);
        }
        dockerLogin (settings, profile, async (code)=>{
            if (code === 0){
                await publish (profile, settings, projectSettings.appId, version, semanticVersion, description, (code)=>{
                    //Docker logout
                    child_process.spawn ('docker', ['logout', settings.REPOSITORY]);
                    process.exit (code);
                });

            }
            else{
                process.exit (code);
            }
        });
    }
    else{
        console.error ('Could not get account settings.');
        process.exit (-1);
    }
   
};

exports.run = async function (argv){
    nonce.check (argv.nonce);
    nonce.add (argv.nonce);
    let profile;
    if (process.env.WYLIODRIN_STUDIO_THEIA && process.env.USER){
        profile = process.env.USER;
    }
    else{
        profile = profileService.getCurrentProfile().profile;
    }
    let productId = argv.product_id;
    let app;
    if (productApi){
        let product = await productApi.get (productId);
        if (product){
            if (product.type === 'development'){
                if (product.status === 'offline'){
                    console.error ('Device might be offline.');
                }
                let projectSettings;
                if (process.env.WYLIODRIN_PROJECT_ID){
                    console.log ('Using environment configurations');
                    let onlineProject = await projectApi.get (process.env.WYLIODRIN_PROJECT_ID);
                    if (onlineProject){
                        projectSettings = {
                            name: onlineProject.name,
                            appId: onlineProject.appId,
                            language: projectLanguages[onlineProject.language],
                            id: onlineProject.projectId,
                            platform: onlineProject.platform,
                            ui: onlineProject.ui
                        };
                    }
                    else{
                        console.error ('Cannot get project.');
                        process.exit (-1);
                    }
                }
                else{
                    projectSettings = await getProjectSettings(process.cwd());
                }
                let appId = projectSettings.appId;
                if (appId.substring (0, 5) === 'local'){
                    console.error ('No application assigned.');
                }
                app = await appApi.get (appId);
                if (!app){
                    console.error ('Please provide an existing application id.');
                    process.exit (-1);
                }
                let settings = await settingsApi.get ();
                if (settings){
                    if (settings.PLATFORM[projectSettings.platform].docker.platform == 'none'){
                        build (projectSettings, settings, appId, 'dev', argv['session-id'], productId, async (code)=>{
                            process.exit (code);
                        });
                    }
                    else{
                        dockerLogin (settings, profile, (code)=>{
                            if (code === 0){
                                build (projectSettings, settings, appId, 'dev', undefined, undefined, async (code)=>{
                                    if (code === 0){
                                        await publishDev (profile, settings, appId, 'dev', (code)=>{
                                            if (code === 0){
                                                console.log ('Pinging device...');
                                                let online = false;
                                                let timer = setTimeout (function (){
                                                    if (!online){
                                                        console.error ('Ping timeout. Device offline.');
                                                        process.exit (-1);
                                                    }
                                                }, 10000);
                                                socketService.connect (profile.api, profile.token, ()=>{
                                                    socketService.send ('packet', productId, {
                                                        t: 'r',
                                                        d:{
                                                            a: 'p',
                                                            id: appId
                                                        }
                                                    });
                                                }, async (data)=>{
                                                    if (data.t === 'r' && data.d.id === appId){
                                                        if (data.d.a === 'e'){
                                                            if (data.d.e === 'norun'){
                                                                //TODO
                                                            }
                                                        }
                                                        else if (data.d.a === 'k'){
                                                            process.stdout.write (data.d.t);
                                                        }
                                                        else if (data.d.a === 's'){
                                                            process.exit (0);
                                                        }
                                                        else if (data.d.a === 'p'){
                                                            online = true;
                                                            clearTimeout(timer);
                                                            socketService.send ('packet', productId, {
                                                                t: 'r',
                                                                d: {
                                                                    id: appId,
                                                                    a: 'e',
                                                                    priv: app.privileged,
                                                                    net: app.network,
                                                                    p: app.parameters,
                                                                    c: process.stdout.columns,
                                                                    r: process.stdout.rows,
                                                                    reset: (argv.reset !== 'false')? true: false
                                                                }
                                                            });
                                                            console.log ('Press Ctrl+q to exit the application.');
                                                            console.log ('Press Ctrl+r to reload application.');
                                                            process.stdin.setRawMode (true);
                                                            process.stdin.setEncoding( 'utf8' );
                                                            readline.emitKeypressEvents(process.stdin);
                                                            process.stdin.on('keypress', async (str, key) => {
                                                                if (key.ctrl && key.name === 'q'){
                                                                    socketService.send ('packet', productId, {
                                                                        t: 'r',
                                                                        d: {
                                                                            id: appId,
                                                                            a:'s'
                                                                        }
                                                                    });
                                                                    console.log ('');
                                                                    console.log ('Disconnected');
                                                                    process.exit (0);
                                                                }
                                                                else if (key.ctrl && key.name === 'r'){
                                                                    let app = await appApi.get (appId);
                                                                    if (app){
                                                                        socketService.send ('packet', productId, {
                                                                            t: 'r',
                                                                            d: {
                                                                                id: appId,
                                                                                a: 'e',
                                                                                priv: app.privileged,
                                                                                net: app.network,
                                                                                p: app.parameters,
                                                                                c: process.stdout.columns,
                                                                                r: process.stdout.rows,
                                                                                reset: (argv.reset !== 'false')? true: false
                                                                            }
                                                                        });
                                                                    }
                                                                    else{
                                                                        console.error ('Application not found.');
                                                                    }
                                                                }
                                                                else{
                                                                    socketService.send ('packet', productId, {
                                                                        t: 'r',
                                                                        d: {
                                                                            id: appId,
                                                                            a:'k',
                                                                            t:str
                                                                        }
                                                                    });
                                                                }
                                                            });
                                                            process.stdout.on('resize', function() {
                                                                socketService.send ('packet', productId, {
                                                                    t: 'r',
                                                                    d: {
                                                                        id: appId,
                                                                        a: 'r',
                                                                        c: process.stdout.columns,
                                                                        r: process.stdout.rows
                                                                    }
                                                                });
                                                            }); 
                                                        }
                                                    }
                                                });
                                            }
                                            else{
                                                process.exit (code);
                                            }
                                        });
                                    }
                                    else{
                                        process.exit (code);
                                    }
                                });
                            }
                            else{
                                process.exit (code);
                            }
                        });
                    }
                }
                else{
                    console.error ('Could not get account settings.');
                    process.exit (-1);
                }
            }
            else{
                console.log ('The provided product is not in development mode.');
                console.log ('Please provide the id of a product in development mode.');
            }
        }
        else{
            console.log ('Please provide a valid project id.')
        }
    }
    else{
        console.error ('No credentials. Please login or select a profile.');
        process.exit (-1);
    }
};

exports.list = async function (argv){
    nonce.check (argv.nonce);
    nonce.add (argv.nonce);
    if (projectApi){
        let projects = await projectApi.list ();
        if (argv.o === 'json')
            console.log (JSON.stringify (projects, null, 3));
        else if (projects && projects.length > 0){
            let format = argv.f;
            if (format === undefined)
                format = tableBuilder.getDefaultProject ();
            else if (format.indexOf ('wide') != -1){
                format = tableBuilder.getWideProject ();
            }
            let header = tableBuilder.header (format, 'project');
            let table = new Table({
                head: header
            });            
            for (project of projects){
                let values = [];
                for (f of format){
                    if (f === 'appId'){
                        if (project.appId)
                            values.push (project.appId);
                        else
                            values.push ('-');
                    }
                    else{
                        values.push (project[f]);
                    }
                }
                table.push (values);
            }
            console.log (table.toString());
        }
        else
            console.log ('No projects to display.');
    }
    else{
        console.error ('No credentials. Please login or select a profile.');
        process.exit (-1);
    }
};