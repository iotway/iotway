const deployApi = require ('../utils/api').deploy;
const Table = require ('cli-table');

exports.list = async function (argv){
    if (deployApi){
        if (argv.app){
            let deployments = await deployApi.list (argv.app);
            if (argv.f === 'json')
                console.log (JSON.stringify (deployments, null, 3));
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
            if (argv.f === 'json')
                console.log (JSON.stringify (deployments, null, 3));
            else if (deployments && deployments.length > 0){
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
            console.error ('Must specify an option.');
            console.error ('Run help to check for options');
            process.exit (-1);
        }
    }
    else{
        console.error ('No credentials. Please login or select a profile.');
        process.exit (-1);
    }
};

exports.versions = async function (argv){
    if (deployApi){
        let versions = await deployApi.versions (argv.platform);

        if (versions)
            console.log (versions);
        else
            console.log ('No versions to display');
    }
    else{
        console.error ('No credentials. Please login or select a profile.');
        process.exit (-1);
    }
};

exports.edit = async function (argv){
    let params = {
        deployId: argv.deploy_id,
        network: argv.network,
        privileged: argv.privileged
    };
    if (deployApi){
        let result = await deployApi.edit (params);

        if (result)
            console.log ('Deployment updated successfully.');
        else{
            console.error ('Could not update deployment.');
            process.exit (-1);
        }
    }
    else{
        console.error ('No credentials. Please login or select a profile.');
        process.exit (-1);
    }
};

exports.upgrade = async function (argv){
    let params = {
        deployId: argv.deploy_id,
        appId: argv.app_id
    };
    if (deployApi){
        let result = await deployApi.upgrade (params);

        if (result)
            console.log ('Deployment upgraded successfully.');
        else{
            console.error ('Could not upgrade deployment.');
            process.exit (-1);
        }
    }
    else{
        console.error ('No credentials. Please login or select a profile.');
        process.exit (-1);
    }
};

exports.addParam = async function (argv){
    let params = {
        deployId: argv.id,
        appId: argv.appId,
        name: argv.name,
        value: argv.values
    };
    if (deployApi){
        let response = await deployApi.addParam (params);
        if (response)
            console.log ('Parameter added to application.');
        else{
            console.error ('Could not add parameter to application.');
            process.exit (-1);
        }
    }
    else{
        console.error ('No credentials. Please login or select a profile.');
        process.exit (-1);
    }
};

exports.deleteParam = async function (argv){
    let params = {
        deployId: argv.id,
        appId: argv.appId,
        name: argv.name
    };
    if (deployApi){
        let response = await deployApi.delParam (params);
        if (response)
            console.log ('Parameter removed from application.');
        else{
            console.error ('Could not remove parameter from application.');
            process.exit (-1);
        }
    }
    else{
        console.error ('No credentials. Please login or select a profile.');
        process.exit (-1);
    }
};

exports.get = async function (argv){
    if (deployApi){
        let response = await deployApi.get (argv.deploy_id);
        if (response)
            console.log (JSON.stringify (response, null, 3));
        else
            console.log ('No deployment to display.');
    }
    else{
        console.error ('No credentials. Please login or select a profile.');
        process.exit (-1);
    }
}
