const deployApi = require ('../utils/api').deploy;
const Table = require ('cli-table');
const tableBuilder = require ('../utils/table');
const nonce = require ('../utils/nonce');
exports.list = async function (argv){
    nonce.check (argv.nonce);
    nonce.add (argv.nonce);
    if (deployApi){
        let deployments = [];
        if (argv.app){
            deployments = await deployApi.list (argv.app);
        }
        else if (argv.prod){
            deployments = await deployApi.deploymentsProduct (argv.prod);
        }
        else{
            console.error ('Must specify an option.');
            console.error ('Run help to check for options');
            process.exit (-1);
        }

        if (argv.o === 'json')
                console.log (JSON.stringify (deployments, null, 3));
        else if (deployments && deployments.length > 0){
            let format = argv.f;
            if (format === undefined)
                format = tableBuilder.getDefaultDeploy ();
            else if (format.indexOf ('wide') != -1){
                format = tableBuilder.getWideDeploy ();
            }
            let header = tableBuilder.header (format, 'deploy');
            let table = new Table({
                head: header
            });  
            let targetIndex = format.indexOf ('targetId');
            if (targetIndex != -1){
                format.push ('id');
                format.splice (targetIndex, 1);
            }          
            for (depl of deployments){
                let values = [];
                for (f of format){
                    if (f === 'rollback' &&  (depl[f] === null || depl[f] === undefined)) 
                        values.push ('');
                    else
                        values.push (depl[f]);
                }
                table.push (values);
            }
            console.log (table.toString());
        }
        else
            console.log ('No deployments to display.');
    }
    else{
        console.error ('No credentials. Please login or select a profile.');
        process.exit (-1);
    }
};

exports.versions = async function (argv){
    nonce.check (argv.nonce);
    nonce.add (argv.nonce);
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
    nonce.check (argv.nonce);
    nonce.add (argv.nonce);
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
    nonce.check (argv.nonce);
    nonce.add (argv.nonce);
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
    nonce.check (argv.nonce);
    nonce.add (argv.nonce);
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
    nonce.check (argv.nonce);
    nonce.add (argv.nonce);
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
    nonce.check (argv.nonce);
    nonce.add (argv.nonce);
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
