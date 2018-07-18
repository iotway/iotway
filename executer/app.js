const appApi = require ('../utils/api').apps;
const Table = require ('cli-table');
const tableBuilder = require ('../utils/table');

exports.new = async function (argv){
    let params = {
        appId: argv.id,
        author: argv.author,
        platform: argv.platform,
        privileged: argv.privileged,
        name: argv.name
    }
    if (appApi){
        let response = await appApi.new (params);
        if (response)
            console.log ('Application created successfully.');

        else{
            console.error ('Could not create application.');
            process.exit (-1);
        }
    }
    else{
        console.error ('No credentials. Please login or select a profile.');
        process.exit (-1);
    }
};

exports.list = async function (argv){
    if (appApi){
        let apps = await appApi.list ();
        if (argv.o === 'json'){
            console.log (JSON.stringify(apps, null, 3));
        }
        else if (apps && apps.length > 0){
            let format = argv.f;
            if (format === undefined)
                format = tableBuilder.getDefaultApp ();
            else if (format.indexOf ('wide') != -1){
                format = tableBuilder.getWideApp ();
            }
            let header = tableBuilder.header (format, 'app');
            let table = new Table({
                head: header
            });
            for (app of apps){
                let values = [];
                for (f of format){
                    values.push (app[f]);
                }
                table.push (values);
            }
            console.log (table.toString());
        }
        else
            console.error ('No applications to display.');
    }
    else{
        console.error ('No credentials. Please login or select a profile.');
        process.exit (-1);
    }
};

exports.edit = async function (argv){
    let params = {
        appId: argv.app_id,
        name: argv.name,
        privileged: argv.privileged,
        network: argv.network
    }
    if (appApi){
        let response = await appApi.edit (params);
        if (response)
            console.log ('Application updated successfully.');
        else{
            console.error ('Could not update application.');
            process.exit (-1);
        }
    }
    else{
        console.error ('No credentials. Please login or select a profile.');
        process.exit (-1);
    }
};

exports.delete = async function (argv){
    if (appApi){
        let response = await appApi.delete (argv.app_id);
        if (response)
            console.log ('Application removed.');
        else{
            console.error ('Could not remove application.');
            process.exit (-1);
        }
    }
    else{
        console.error ('No credentials. Please login or select a profile.');
        process.exit (-1);
    }
};

exports.get = async function (argv){
    if (appApi){
        let app = await appApi.get (argv.app_id);
        if (app)
            console.log (JSON.stringify(app, null, 3));
        else{
            console.log ('Could not get application.');
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
        appId: argv.id,
        name: argv.name,
        value: argv.values
    };
    if (appApi){
        let response = await appApi.addParam (params);
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
        appId: argv.id,
        name: argv.name
    };
    if (appApi){
        let response = await appApi.delParam (params);
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

exports.versions = async function (argv){
    if (appApi){
        let versions = await appApi.versions (argv.app_id);
        if (versions)
            console.log (versions);
        else{
            console.error ('Could not get versions.');
            process.exit (-1);
        }
    }
    else{
        console.error ('No credentials. Please login or select a profile.');
        process.exit (-1);
    }
};

exports.deploy = async function (argv){
    let params = {
        appId: argv.id,
        clusterId: argv.clusterId,
        version: argv.version,
        rollback: (argv.rollback === 0)? null: argv.rollback,
        network:argv.network,
        privileged: argv.privileged,
        type: argv.type
    }
    if (argv.parameterName && argv.parameterValues){
        params.parameters[argv.parameterName] = argv.parameterValues;
    }
    if (appApi){
        let response = await appApi.deploy (params);
        if (response)
            console.log ('Application deployed successfully.');
        else{
            console.error ('Could not deploy application.');
            process.exit (-1);
        }
    }
    else{
        console.error ('No credentials. Please login or select a profile.');
        process.exit (-1);
    }
};

exports.undeploy = async function (argv){
    let params = {
        deployId: argv.id,
        appId: argv.appId,
        clusterId: argv.clusterId,
        type: argv.type
    };
    if (appApi){
        let response = await appApi.undeploy (params);
        if (response)
            console.log ('Application undeployed successfully.');
        else{
            console.error ('Could not undeploy application.');
            process.exit (-1);
        }
    }
    else{
        console.error ('No credentials. Please login or select a profile.');
        process.exit (-1);
    }
};