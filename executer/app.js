const appApi = require ('libiotway').get().apps;
const Table = require ('cli-table');
const tableBuilder = require ('../utils/table');
const semver = require ('semver');
const nonce = require ('../utils/nonce');
const errorFile = require ('../utils/settings').errorFile;
const error = require ('../utils/error');

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
        try{
            await appApi.new (params);
            console.log ('Application created successfully.');
        }
        catch (err){
            console.error ('Could not create application. Check ' + errorFile + ' file for more details.');
            error.addError (err);
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
        try{
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
        catch (err){
            console.error ('Could not list application. Check ' + errorFile + ' file for more details.');
            error.addError (err);
            process.exit (-1);
        }
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
        try{
            await appApi.edit (params);
            console.log ('Application updated successfully.');
        }
        catch (err){
            console.error ('Could not update application. Check ' + errorFile + ' file for more details.');
            error.addError (err);
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
        try{
            await appApi.delete (argv.app_id);
            console.log ('Application removed.');
        }
        catch(err){
            console.error ('Could not remove application. Check ' + errorFile + ' file for more details.');
            error.addError (err);
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
        try{
            let app = await appApi.get (argv.app_id);
            console.log (JSON.stringify(app, null, 3));
        }
        catch (err){
            console.log ('Could not get application. Check ' + errorFile + ' file for more details.');
            error.addError (err);
            process.exit (-1);
        }
    }
    else{
        console.error ('No credentials. Please login or select a profile.');
        process.exit (-1);
    }
};

// exports.addParam = async function (argv){
//     nonce.check (argv.nonce);
//     nonce.add (argv.nonce);
//     let params = {
//         appId: argv.id,
//         name: argv.name,
//         value: argv.values
//     };
//     if (appApi){
//         let response = await appApi.addParam (params);
//         if (response)
//             console.log ('Parameter added to application.');
//         else{
//             console.error ('Could not add parameter to application. Check log file for more details.');
//             process.exit (-1);
//         }
//     }
//     else{
//         console.error ('No credentials. Please login or select a profile.');
//         process.exit (-1);
//     }
// };

// exports.deleteParam = async function (argv){
//     nonce.check (argv.nonce);
//     nonce.add (argv.nonce);
//     let params = {
//         appId: argv.id,
//         name: argv.name
//     };
//     if (appApi){
//         let response = await appApi.delParam (params);
//         if (response)
//             console.log ('Parameter removed from application.');
//         else{
//             console.error ('Could not remove parameter from application. Check log file for more details.');
//             process.exit (-1);
//         }
//     }
//     else{
//         console.error ('No credentials. Please login or select a profile.');
//         process.exit (-1);
//     }
// };

exports.versions = async function (argv){
    nonce.check (argv.nonce);
    nonce.add (argv.nonce);
    if (appApi){
        try{
            let versions = await appApi.versions (argv.app_id);
            console.log (versions);
        }
        catch (err){
            console.error ('Could not get versions. Check ' + errorFile + ' file for more details.');
            error.addError (err);
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
        try{
            await appApi.deploy (params);
            console.log ('Application deployed successfully.');
        }
        catch(err){
            console.error ('Could not deploy application. Check ' + errorFile + ' file for more details.');
            error.addError (err);
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
        try{
            await appApi.undeploy (params);
            console.log ('Application undeployed successfully.');
        }
        catch (err){
            console.error ('Could not undeploy application. Check ' + errorFile + ' file for more details.');
            error.addError (err);
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
        try{
            await appApi.editVersion (argv.app_id, argv.app_version, params);
            console.log ('Application updated successfully.');
        }
        catch (err){
            console.error ('Could not update application. Check ' + errorFile + ' file for more details.');
            error.addError (err);
            process.exit (-1);
        }
    }
    else{
        console.error ('No credentials. Please login or select a profile.');
        process.exit (-1);
    }
}