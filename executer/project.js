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

const projectLanguages = {
    js: 'javascript',
    javascript: 'javascript',
    nodejs: 'javascript',
    py: 'python',
    python: 'python'
}
exports.init = async function (argv){
    let contents = fs.readdirSync (process.cwd());
    if (contents.length === 0 || (contents.length === 1 && contents[0] === 'project.log')){
        let project;
        if (userApi){
            let user = await userApi.get ();
            if (user){
                if (process.env.WYLIODRIN_PROJECT_ID){
                    console.log ('Using environment configurations');
                    let onlineProject = await projectApi.get (process.env.WYLIODRIN_PROJECT_ID);
                    if (onlineProject){
                        project = {
                            name: onlineProject.name,
                            appId: onlineProject.appId,
                            language: projectLanguages[onlineProject.language],
                            id: onlineProject.projectId,
                            platform: onlineProject.platform,
                            ui: onlineProject.ui
                        };
                    }
                    else{
                        console.error ('Could not find project.');
                        process.exit (-1);
                    }
                }
                else{
                    // project = {
                    //     name: argv.name,
                    //     appId: argv.appId,
                    //     language: projectLanguages[argv.language],
                    //     id: argv.id,
                    //     platform: argv.platform,
                    //     ui: argv.ui
                    // };
                    console.error ('WYLIODRIN_PROJECT_ID is not defined.');
                    process.exit (-1);
                }
                if (project.name && project.appId && project.language){
                    if (project.appId.substring (0, 5) !== 'local'){
                        let app = await appApi.get (project.appId);
                        if (!app){
                            console.error ('Please provide a valid application id.');
                            process.exit (-1);
                        }
                    }
                    //Generate project structure
                    // fs.writeFileSync (path.join(process.cwd(), 'wylioproject.json'), JSON.stringify(project));
                    fs.copySync(path.normalize (__dirname + '/../utils/project_templates/' + project.language),
                                            process.cwd());
                    //Generate package.json for js projects
                    if (project.language === 'javascript'){
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
                    console.error ('Please provide a project name, a project language and a valid application id.');
                    process.exit (-1);
                }
            }
            else{
                console.error ('Invalid profile. Please login again.');
                process.exit (-1);
            }
        }
        else{
            console.error ('No credentials. Please login or select a profile.');
            process.exit (-1);
        }
    }
    else{
        console.log ('Folder not empty. Please run command in an empty folder.');
    }
};

function build(projectSettings, settings, appId, version, cb){
    //Run make
    console.log ('make');
    let make = child_process.spawn ('make');
    make.stdout.on ('data', (data)=>{
        process.stdout.write (data.toString());
    });
    make.stderr.on ('data', (data)=>{
        process.stderr.write (data.toString());
    })
    make.on ('exit', (code)=>{
        if (code === 0){
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
                process.stdout.write (data.toString());
            });
            dockerBuild.stderr.on ('data', (data)=>{
                process.stderr.write (data.toString());
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

function publish (profile, settings, appId, version, cb){
    let buildFolder = path.join(process.cwd(), 'build');
    //Run docker login
    let dockerLogin = child_process.spawn ('docker', ['login', settings.REPOSITORY, '-u', profile.username, '-p', profile.token]);
    dockerLogin.stdout.on ('data', (data)=>{
        process.stdout.write (data.toString());
    });
    dockerLogin.stderr.on ('data', (data)=>{
        process.stderr.write (data.toString());
    });
    dockerLogin.on ('exit', (code)=>{
        if (code === 0){
            //Push docker image
            console.log ('Pushing docker image. Please wait.');
            let dockerPush = child_process.spawn ('docker', ['push', settings.REPOSITORY+'/'+appId+':'+version], {cwd: buildFolder});
            dockerPush.stdout.on ('data', (data)=>{
                process.stdout.write (data.toString());
            });
            dockerPush.stderr.on ('data', (data)=>{
                process.stderr.write (data.toString());
            });
            dockerPush.on ('exit', (code)=>{
                //Docker logout
                child_process.spawn ('docker', ['logout', settings.REPOSITORY]);
                cb (code);
            });
        }
        else{
            process.exit (code);
        }
    });
}

function checkVersion (appId, version){
    let versions = await appApi.versions (appId);
    if (versions && versions.length === 0)
        return true;
    let max = Math.max (...versions);
    return version > max;
}

exports.build = async function (argv){
    let version = argv.version;
    if (!version){
        version = 'dev';
    }
    else if (!checkVersion (appId, version)){
        console.log ('The provided version is less or equal to the latest published version.');
        console.log ('The Docker image will be created but it cannot be published.');
    }
    let projectSettings;
    if (process.env.WYLIODRIN_PROJECT_ID){
        console.log ('Using environment variables');
        projectSettings = await projectApi.get (process.env.WYLIODRIN_PROJECT_ID);
        //TODO - write settings file
    }
    else{
        //TODO - de citit fisierul
    }
    let settings = await settingsApi.get ();
    if (settings){
        let appId = projectSettings.appId;
        build (projectSettings, settings, appId, version, (code)=>{
            process.exit (code);
        })
    }
    else{
        console.error ('Could not get account settings.');
        process.exit (-1);
    }
};

exports.publish = async function (argv){
    let profile = profileService.getCurrentProfile().profile;
    let version = argv.version;
    if (!checkVersion (appId, version)){
        console.error ('The provided version is less or equal to the latest published version.');
        console.error ('Cannot publish docker image.');
        process.exit (-1);
    }
    let projectSettings;
    if (process.env.WYLIODRIN_PROJECT_ID){
        console.log ('Using environment variables');
        projectSettings = await projectApi.get (process.env.WYLIODRIN_PROJECT_ID);
        //TODO - write settings file
    }
    else{
        //TODO - de citit fisierul
    }
    let settings = await settingsApi.get ();
    if (settings){
        let appId = projectSettings.appId;
        if (appId.substring (0, 5) !== 'local'){
            console.error ('This project has no application assigned.');
            process.exit (-1);
        }
        app = await appApi.get (appId);
        if (!app){
            console.error ('Please provide an existing application id.');
            process.exit (-1);
        }
        publish (profile, settings, appId, version, (code)=>{
            process.exit (code);
        });
    }
    else{
        console.error ('Could not get account settings.');
        process.exit (-1);
    }
   
};

exports.run = async function (argv){
    let productId = argv.product_id;
    let profile = profileService.getCurrentProfile().profile;
    let app;
    if (productApi){
        let product = await productApi.get (productId);
        if (product){
            //todo - de mutat sus dupa pong
            if (product.type === 'development'){
                if (product.status === 'offline'){
                    console.error ('Device offline');
                    process.exit (-1);
                }
                else {
                    let online = false;
                    let timer = setTimeout (function (){
                        if (!online){
                            console.error ('Device offline.');
                            process.exit (-1);
                        }
                    }, 10000);
                    let socket = socketService.connect (profile.api, profile.token, ()=>{
                        socketService.send ('packet', productId, {t: 'ping'});
                    }, (data)=>{
                        if (data.t === 'pong'){
                            socket.disconnect ();
                            online = true;
                            clearTimeout(timer);
                            if (process.env.WYLIODRIN_PROJECT_ID){
                                let projectSettings = await projectApi.get (process.env.WYLIODRIN_PROJECT_ID);
                                if (!projectSettings){
                                    console.error ('Could not find project.');
                                    process.exit (-1);
                                }
                                let appId = projectSettings.appId;
                                if (appId.substring (0, 5) !== 'local'){
                                    app = await appApi.get (appId);
                                    if (!app){
                                        console.error ('Please provide an existing application id.');
                                        process.exit (-1);
                                    }
                                }
                                let settings = await settingsApi.get ();
                                if (settings){
                                    build (projectSettings, settings, appId, 'dev', (code)=>{
                                        if (code === 0){
                                            publish (profile, settings, appId, 'dev', (code)=>{
                                                if (code === 0){
                                                    socketService.connect (profile.api, profile.token, ()=>{
                                                        socketService.send ('packet', productId, {
                                                            t: 'r',
                                                            d: {
                                                                id: appId,
                                                                a: 'e',
                                                                priv: app.privileged,
                                                                net: app.network,
                                                                p: app.parameters,
                                                                c: process.stdout.columns,
                                                                r: process.stdout.rows
                                                            }
                                                        });
                                                        console.log ('Press Ctrl+q to exit the application.')
                                                        process.stdin.setRawMode (true);
                                                        process.stdin.setEncoding( 'utf8' );
                                                        readline.emitKeypressEvents(process.stdin);
                                                        process.stdin.on('keypress', (str, key) => {
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
                                                    }, (data)=>{
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
                                    console.error ('Could not get account settings.');
                                    process.exit (-1);
                                }
                            }
                            else{
                                console.error ('WYLIODRIN_PROJECT_ID is not defined.');
                                process.exit (-1);
                            }
                        }
                    });
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