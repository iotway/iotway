const appApi = require ('../utils/api').apps;
const productApi = require ('../utils/api').products;
const settingsApi = require ('../utils/api').settings;
const profileService = require ('../service/profile');
const fs = require ('fs-extra');
const path = require ('path');
const spawn = require ('child_process').spawnSync;

const projectLanguages = {
    js: 'javascript',
    javascript: 'javascript',
    py: 'python',
    python: 'python'
}
exports.init = async function (argv){
    let name;
    let appId;
    let language;
    if (process.env.WYLIODRIN_PROJECT_ID){
        console.log ('Using environment configurations');
        //TODO - de luat datele de pe server
    }
    else{
        name = argv.name;
        appId = argv.appId;
        language = argv.language;
    }
    if (name && appId && language){
        let app = await appApi.get (appId);
        if (!app){
            console.log ('Please provide a valid application id.');
            process.exit (-1);
        }
        else{
            let configData = {
                appId: appId,
                name: name,
                language: language
            }
            fs.writeFileSync (path.join(process.cwd(), 'wylioproject.json'), JSON.stringify(configData));
            fs.copySync(path.normalize (__dirname + '/../utils/project_templates/' + projectLanguages[language]),
                                    process.cwd());
        }
    }
    else{
        console.log ('Please provide a project name, a project language and a valid application id.');
        process.exit (-1);
    }
};

exports.run = async function (argv){
    let productId = argv.product_id;
    let product = await productApi.get (productId);

    if (product){
        if (product.type === 'development'){
            try{
                let file = fs.readFileSync(path.join(process.cwd(), 'wylioproject.json'), 'utf8');
                file = JSON.parse (file);
                let appId = file.appId;
                let settings = await settingsApi.get ();
                if (settings){
                    let profile = profileService.getCurrentProfile().profile;
                    try{
                        child_process.execSync ('docker login ' + settings.REPOSITORY + ' -u ' + profile.username + ' -p ' + profile.token);
                        child_process.execSync ('docker build -t '+settings.REPOSITORY+'/'+appId+':dev', {cwd: settings.dir});
                        child_process.execSync ('docker push '+settings.REPOSITORY+'/'+appId+':dev', {cwd: settings.dir});
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
}