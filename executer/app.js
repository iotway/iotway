const appApi = require ('../utils/api').apps;
const Table = require ('cli-table');

exports.new = async function (argv){
    let params = {
        appId: argv.id,
        author: argv.author,
        platform: argv.platform,
        privileged: argv.privileged,
        name: argv.name
    }
    let response = await appApi.new (params);
    if (response)
        console.log ('Application created successfully.');
    else
        console.log ('Could not create application.');
};

exports.list = async function (argv){
    let apps = await appApi.list ();
    if (apps && apps.length > 0){
        let table = new Table({
            head: ['Name', 'Id', 'Author', 'Platform', 'Privileged']
        });
        for (app of apps){
            let priv = (app.privileged)? 'yes': 'no';
           table.push ([app.name, app.appId, app.author, app.platform, priv]);
        }
        console.log (table.toString());
    }
    else
        console.log ('No applications to display.');
};

exports.edit = async function (argv){
    let params = {
        appId: argv.app_id,
        name: argv.name,
        privileged: argv.privileged,
        network: argv.network
    }

    let response = await appApi.edit (params);
    if (response)
        console.log ('Application updated successfully.');
    else
        console.log ('Could not update application.');
};

exports.delete = async function (argv){
    let response = await appApi.delete (argv.app_id);
    if (response)
        console.log ('Application removed.');
    else
        console.log ('Could not remove application.');
};

exports.get = async function (argv){
    let app = await appApi.get (argv.app_id);
    if (app)
        console.log (JSON.stringify(app, null, 3));
    else
        console.log ('Could not get application.');
};

exports.addParam = async function (argv){
    let params = {
        appId: argv.appId,
        name: argv.name,
        value: argv.values
    };

    let response = await appApi.addParam (params);
    if (response)
        console.log ('Parameter added to application.');
    else
        console.log ('Could not add parameter to application.');
};

exports.deleteParam = async function (argv){
    let params = {
        appId: argv.appId,
        name: argv.name
    };

    let response = await appApi.delParam (params);
    if (response)
        console.log ('Parameter removed from application.');
    else
        console.log ('Could not remove parameter from application.');
};

exports.versions = async function (argv){
    let versions = await appApi.versions (argv.app_id);
    if (versions)
        console.log (versions);
    else
        console.log ('Could not get versions.');
};

exports.deploy = async function (argv){
    let params = {
        appId: argv.appId,
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

    let response = await appApi.deploy (params);
    if (response)
        console.log ('Application deployed successfully.');
    else
        console.log ('Could not deploy application.');
};

exports.undeploy = async function (argv){
    let params = {
        deployId: argv.id,
        appId: argv.appId,
        clusterId: argv.clusterId,
        type: argv.type
    };

    let response = await appApi.undeploy (params);
    if (response)
        console.log ('Application undeployed successfully.');
    else
        console.log ('Could not undeploy application.');
};