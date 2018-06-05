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
const spawn = require ('child_process').spawnSync;
const mustache = require ('mustache');

const projectLanguages = {
    js: 'javascript',
    javascript: 'javascript',
    nodejs: 'javascript',
    py: 'python',
    python: 'python'
}
exports.init = async function (argv){
    let project;
    if (userApi){
        let user = await userApi.get ();
        if (user){
            if (process.env.WYLIODRIN_PROJECT_ID){
                console.log ('Using environment configurations');
                let onlineProject = await projectApi.get (process.env.WYLIODRIN_PROJECT_ID);
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
                project = {
                    name: argv.name,
                    appId: argv.appId,
                    language: projectLanguages[argv.language],
                    id: argv.id,
                    platform: argv.platform,
                    ui: argv.ui
                };
            }
            if (project.name && project.appId && project.language){
                let app = await appApi.get (project.appId);
                if (!app){
                    console.log ('Please provide a valid application id.');
                    process.exit (-1);
                }
                else{
                    //Generate project structure
                    fs.writeFileSync (path.join(process.cwd(), 'wylioproject.json'), JSON.stringify(project));
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
            }
            else{
                console.log ('Please provide a project name, a project language and a valid application id.');
                process.exit (-1);
            }
        }
        else{
            console.log ('Invalid profile. Please login again.');
            process.exit (-1);
        }
    }
    else{
        console.error ('No credentials. Please login or select a profile.');
        process.exit (-1);
    }
};

exports.run = async function (argv){
    let productId = argv.product_id;
    let product = await productApi.get (productId);
    if (product){
        if (product.type ){//=== 'development'){
            try{
                let projectSettings = fs.readFileSync(path.join(process.cwd(), 'wylioproject.json'), 'utf8');
                projectSettings = JSON.parse (projectSettings);
                console.log (projectSettings);
                if (projectSettings.id){
                    let project = await projectApi.get (projectSettings.id);
                    console.log (project);
                    if (project)
                        projectSettings = project;
                }
                let appId = projectSettings.appId;
                let settings = await settingsApi.get ();
                let docker = fs.readFileSync (path.join (process.cwd(), 'dockerfile'), 'utf8');
                let libraries = fs.readFileSync (path.normalize (__dirname + '/../utils/docker/libraries/' + projectSettings.language), 'utf8');
                if (settings){
                    let profile = profileService.getCurrentProfile().profile;
                    let dockerData = {
                        REPOSITORY: settings.REPOSITORY,
                        DEPLOYER_DOMAIN: settings.DEPLOYER,
                        project: projectSettings,
                        arm: (projectSettings.platform === 'arm')? true: false,
                        dockerfile: docker,
                        libraries: libraries
                    }
                    let dockerTemplate = fs.readFileSync (path.normalize (__dirname + '/../utils/docker/project_template'), 'utf8');
                    let dockerFile = mustache.render (dockerTemplate, dockerData);
                    let buildFolder = path.join(process.cwd(), 'build');
                    fs.writeFileSync (path.join(buildFolder, 'dockerfile'), dockerFile);
                    try{
                        child_process.execSync ('docker login ' + settings.REPOSITORY + ' -u ' + profile.username + ' -p ' + profile.token);
                        child_process.execSync ('docker build -t '+settings.REPOSITORY+'/'+appId+':dev', {cwd: buildFolder});
                        child_process.execSync ('docker push '+settings.REPOSITORY+'/'+appId+':dev', {cwd: buildFolder});
                        child_process.execSync ('docker logout '+settings.REPOSITORY);
                        console.log ('Docker image built and pushed successfully.');
                    }
                    catch (err){
                        console.error ('Could not run docker build command. Make sure docker is installed.');
                        process.exit (-1);
                    }
                }
                else{
                    console.error ('Could not get account settings.');
                    process.exit (-1);
                }
            }
            catch (e){
                console.log (e);
                console.log ('Not a wylio project repository.');
                console.log ('Please run wylio init.');
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