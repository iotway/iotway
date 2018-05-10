const deployApi = require ('../utils/api').deploy;
const Table = require ('cli-table');

exports.list = async function (argv){
    if (argv.app){
        let deployments = await deployApi.list (argv.app);
        if (deployments && deployments.length > 0){
            let table = new Table({
                head: ['Id', 'Target', 'Type', 'Version', 'Privileged', 'Network']
            });
            for (depl of deployments){
                let p = (depl.privileged)? 'yes': 'no';
            table.push ([depl.deployId, depl.target, depl.type, depl.version, p, depl.network]);
            }
            console.log (table.toString());
        }
        else
            console.log ('No deployments to display.');
    }
    else if (argv.prod){
        let deployments = await deployApi.deploymentsProduct (argv.prod);
        if (deployments && deployments.length > 0){
            let table = new Table({
                head: ['Id', 'Target', 'Type', 'Version', 'Privileged', 'Network']
            });
            for (depl of deployments){
                let p = (depl.privileged)? 'yes': 'no';
            table.push ([depl.deployId, depl.target, depl.type, depl.version, p, depl.network]);
            }
            console.log (table.toString());
        }
        else
            console.log ('No deployments to display.');
    }
    else{
        console.log ('Must specify an option.');
        console.log ('Run help to check for options');
    }
};

exports.versions = async function (argv){
    let versions = await deployApi.versions (argv.platform);

    if (versions)
        console.log (versions);
    else
        console.log ('No versions to display');
};

exports.edit = async function (argv){
    let params = {
        deployId: argv.deploy_id,
        network: argv.network,
        privileged: argv.privileged
    };

    let result = await deployApi.edit (params);

    if (result)
        console.log ('Deployment updated successfully.');
    else
        console.log ('Could not update deployment.');
};

exports.upgrade = async function (argv){
    let params = {
        deployId: argv.deploy_id,
        appId: argv.app_id
    };

    let result = await deployApi.upgrade (params);

    if (result)
        console.log ('Deployment upgraded successfully.');
    else
        console.log ('Could not upgrade deployment.');
};

exports.addParam = async function (argv){
    let params = {
        deployId: argv.id,
        appId: argv.appId,
        name: argv.name,
        value: argv.values
    };
    let response = await deployApi.addParam (params);
    if (response)
        console.log ('Parameter added to application.');
    else
        console.log ('Could not add parameter to application.');
};

exports.deleteParam = async function (argv){
    let params = {
        deployId: argv.id,
        appId: argv.appId,
        name: argv.name
    };

    let response = await deployApi.delParam (params);
    if (response)
        console.log ('Parameter removed from application.');
    else
        console.log ('Could not remove parameter from application.');
};

exports.get = async function (argv){
    let response = await deployApi.get (argv.deploy_id);
    if (response)
        console.log (JSON.stringify (response, null, 3));
    else
        console.log ('No deployment to display.');
}
