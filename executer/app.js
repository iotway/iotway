const appApi = require ('../utils/api').apps;
const Table = require ('cli-table');
const tableBuilder = require ('../utils/table');
const semver = require ('semver');
const nonce = require ('../utils/nonce');

exports.new = async function (argv){
    nonce.check (argv.nonce);
    nonce.add (argv.nonce);
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
            console.error ('Could not create application. Check log file for more details.');
            process.exit (-1);
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
    nonce.check (argv.nonce);
    nonce.add (argv.nonce);
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
            console.error ('Could not update application. Check log file for more details.');
            process.exit (-1);
        }
    }
    else{
        console.error ('No credentials. Please login or select a profile.');
        process.exit (-1);
    }
};

exports.delete = async function (argv){
    nonce.check (argv.nonce);
    nonce.add (argv.nonce);
    if (appApi){
        let response = await appApi.delete (argv.app_id);
        if (response)
            console.log ('Application removed.');
        else{
            console.error ('Could not remove application. Check log file for more details.');
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
    nonce.check (argv.nonce);
    nonce.add (argv.nonce);
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
            console.error ('Could not add parameter to application. Check log file for more details.');
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
        appId: argv.id,
        name: argv.name
    };
    if (appApi){
        let response = await appApi.delParam (params);
        if (response)
            console.log ('Parameter removed from application.');
        else{
            console.error ('Could not remove parameter from application. Check log file for more details.');
            process.exit (-1);
        }
    }
    else{
        console.error ('No credentials. Please login or select a profile.');
        process.exit (-1);
    }
};

exports.versions = async function (argv){
    nonce.check (argv.nonce);
    nonce.add (argv.nonce);
    if (appApi){
        let versions = await appApi.versions (argv.app_id);
        if (versions)
            console.log (versions);
        else{
            console.error ('Could not get versions. Check log file for more details.');
            process.exit (-1);
        }
    }
    else{
        console.error ('No credentials. Please login or select a profile.');
        process.exit (-1);
    }
};

exports.deploy = async function (argv){
    nonce.check (argv.nonce);
    nonce.add (argv.nonce);
    let params = {
        appId: argv.id,
        clusterId: argv.clusterId,
        version: argv.version,
        rollback: (argv.rollback === 0)? null: argv.rollback,
        network:argv.network,
        privileged: argv.privileged
    }
    if (argv.parameterName && argv.parameterValues){
        params.parameters[argv.parameterName] = argv.parameterValues;
    }
    if (appApi){
        let response = await appApi.deploy (params);
        if (response)
            console.log ('Application deployed successfully.');
        else{
            console.error ('Could not deploy application. Check log file for more details.');
            process.exit (-1);
        }
    }
    else{
        console.error ('No credentials. Please login or select a profile.');
        process.exit (-1);
    }
};

exports.undeploy = async function (argv){
    nonce.check (argv.nonce);
    nonce.add (argv.nonce);
    let params = {
        deployId: argv.app_id
    };
    if (appApi){
        let response = await appApi.undeploy (params);
        if (response)
            console.log ('Application undeployed successfully.');
        else{
            console.error ('Could not undeploy application. Check log file for more details.');
            process.exit (-1);
        }
    }
    else{
        console.error ('No credentials. Please login or select a profile.');
        process.exit (-1);
    }
};

exports.updateVersion = async function (argv){
    nonce.check (argv.nonce);
    nonce.add (argv.nonce);
    let semanticVersion = semver.valid (semver.coerce (argv.semver));
    if (!semanticVersion){
        console.error ('Invalid semantic version.');
        process.exit (-1);
    }
    let params = {
        semver: semanticVersion,
        text: argv.description
    };

    if (appApi){
        let response = await appApi.editVersion (argv.app_id, argv.app_version, params);
        if (response)
            console.log ('Application updated successfully.');
        else{
            console.error ('Could not update application. Check log file for more details.');
            process.exit (-1);
        }
    }
    else{
        console.error ('No credentials. Please login or select a profile.');
        process.exit (-1);
    }
}