const productApi = require ('../utils/api').products;
const deployApi = require ('../utils/api').deploy;
const Table = require ('cli-table');
const moment = require ('moment');
const tableBuilder = require ('../utils/table');
const nonce = require ('../utils/nonce');
exports.provision = async function (argv){
    nonce.check (argv.nonce);
    nonce.add (argv.nonce);
    params = {
        clusterId: argv.clusterId,
        type: argv.type,
        shell: argv.shell,
        name: argv.name,
        platform: argv.platform,
        serial: argv.serial
    }
    if (argv.publicKey && argv.privateKey){
        params.key = {
            public: argv.publicKey,
            private: argv.privateKey
        }
    }
    if (argv.longitude || argv.latitude || argv.altitude){
        params.location = {
            lon: argv.longitude,
            lat: argv.latitude,
            alt: argv.altitude
        }
    }
    if (productApi){
        let response = await productApi.provision (params);
        if (response)
            console.log ('Product successfully provisioned.');
        else{
            console.error ('Could not provision product. Check log file for more details.');
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
    if (productApi){
        let products = await productApi.list (argv.cluster_id);
        if (argv.o === 'json')
            console.log (JSON.stringify (products, null, 3));
        else if (products && products.length > 0){
            let format = argv.f;
            if (format === undefined)
                format = tableBuilder.getDefaultProduct ();
            else if (format.indexOf ('wide') != -1){
                format = tableBuilder.getWideProduct ();
            }
            let header = tableBuilder.header (format, 'product');
            let table = new Table({
                head: header
            });  
            for (product of products){
                let values = [];
                for (f of format){
                    if (f === 'cpu'){
                        if (product.statistics && product.statistics.instant && product.statistics.instant.cpu)
                            values.push (product.statistics.instant.cpu.toFixed(2));
                        else
                            values.push ('');
                    }
                    else if (f === 'latestStatus'){
                        values.push (moment (product[f]).fromNow());
                    }
                    else if (f === 'actions'){
                        let actions = product.actions;
                        let value = '';
                        if (actions){
                            if (actions.distribute)
                                value = value + 'd';
                            else
                                value = value + '-';
                            if (actions.restart)
                                value = value + 'r';
                            else
                                value = value + '-';
                        }
                        else
                            value = '--';
                        values.push (value);
                    }
                    else{
                        values.push (product[f]);
                    }     
                }
                table.push (values);
            }
            console.log (table.toString());
        }
        else
            console.log ('No products to display.');
    }
    else{
        console.error ('No credentials. Please login or select a profile.');
        process.exit (-1);
    }
};

exports.get = async function (argv){
    nonce.check (argv.nonce);
    nonce.add (argv.nonce);
    if (productApi){
        let product = await productApi.get (argv.product_id);
        if (product){
        console.log (JSON.stringify (product, null, 3));
        }
        else
            console.log ('Product not found.');
    }
    else{
        console.error ('No credentials. Please login or select a profile.');
        process.exit (-1);
    }
};

exports.delete = async function (argv){
    nonce.check (argv.nonce);
    nonce.add (argv.nonce);
    if (productApi){
        let response = await productApi.delete (argv.product_id);
        if (response){
        console.log ('Product deleted successfully.');
        }
        else{
            console.log ('Could not delete product. Check log file for more details.');
            process.exit (-1);
        }
    }
    else{
        console.error ('No credentials. Please login or select a profile.');
        process.exit (-1);
    }
};

exports.schedule = async function (argv){
    nonce.check (argv.nonce);
    nonce.add (argv.nonce);
    if (productApi){
        let response = await productApi.schedule({
            productId: argv.product_id,
            action: argv.action});
        if (response){
        console.log ('Action scheduled successfully.');
        }
        else{
            console.error ('Could not schedule action for product. Check log file for more details.');
            process.exit (-1);
        }
    }
    else{
        console.error ('No credentials. Please login or select a profile.');
        process.exit (-1);
    }
};

exports.unschedule = async function (argv){
    nonce.check (argv.nonce);
    nonce.add (argv.nonce);
    if (productApi){
        let response = await productApi.unschedule({
            productId: argv.product_id,
            action: argv.action});
        if (response){
        console.log ('Action unschedule successfully.');
        }
        else{
            console.log ('Could not unschedule action for product. Check log file for more details.');
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
        productId: argv.product_id,
        name: argv.name,
        hardware: argv.hardware,
        shell: argv.shell
    };

    if (argv.longitude || argv.latitude || argv.altitude){
        params.location = {
            lon: argv.longitude,
            lat: argv.latitude,
            alt: argv.altitude
        }
    }

    if ((argv.updateCluster != undefined) || argv.updateHours || argv.updateFrom || argv.updateTo){
        params.update = {
            useCluster: argv.updateCluster,
            betweenHours: argv.updateHours,
            from: argv.updateFrom,
            to: argv.updateTo,
            interval: argv.updateInterval
        }
    }
   // console.log (params);
    if (productApi){
        let response = await productApi.edit (params);
        if (response){
            console.log ('Product successfully updated.');
        }
        else{
            console.error ('Could not update product. Check log file for more details.');
            process.exit (-1);
        }
    }
    else{
        console.error ('No credentials. Please login or select a profile.');
        process.exit (-1);
    }
};

exports.getJson = async function (argv){
    nonce.check (argv.nonce);
    nonce.add (argv.nonce);
    if (productApi){
        let file = await productApi.getWyliodrinJSON (argv.productId);
        if (file)
            console.log (JSON.stringify (file, null, 3));
        else{
            console.error ('Could not get file.');
            process.exit (-1);
        }
    }
    else{
        console.error ('No credentials. Please login or select a profile.');
        process.exit (-1);
    }
};

exports.addScript = async function (argv){
    nonce.check (argv.nonce);
    nonce.add (argv.nonce);
    let params = {
        productId: argv.productId,
        name: argv.name,
        value: argv.command
    }
    if (productApi){
        let response = await productApi.addScript (params);
        if (response)
            console.log ('Script added successfully.');
        else{
            console.log ('Could not add script to product. Check log file for more details.');
            process.exit (-1);
        }
    }
    else{
        console.error ('No credentials. Please login or select a profile.');
        process.exit (-1);
    }
};

exports.deleteScript = async function (argv){
    nonce.check (argv.nonce);
    nonce.add (argv.nonce);
    let params = {
        productId: argv.productId,
        name: argv.name
    }
    if (productApi){
        let response = await productApi.delScript (params);
        if (response)
            console.log ('Script removed successfully.');
        else{
            console.log ('Could not remove script from product. Check log file for more details.');
            process.exit (-1);
        }
    }
    else{
        console.error ('No credentials. Please login or select a profile.');
        process.exit (-1);
    }
};

exports.logs = async function (argv){
    nonce.check (argv.nonce);
    nonce.add (argv.nonce);
    if (productApi){
        let product = await productApi.get (argv.product_id);
        if (argv.o === 'json' && product){
            if (argv.type === 'info')
                console.log (JSON.stringify(product.productLogs, null, 3));
            else if (argv.type === 'error'){
                console.log (JSON.stringify(product.productErrors, null, 3));
            }
            else if (argv.type === 'possible')
                console.log (JSON.stringify(product.possibleErrors, null, 3));
        }
        else if (argv.o === 'json')
            console.log ([]);
        else{
            if (product){
                let logs = [];
                if (argv.type === 'info'){
                    logs = product.productLogs;
                }
                else if (argv.type === 'error'){
                    logs = product.productErrors;
                }
                else if (argv.type === 'possible')
                    logs = product.possibleErrors;
                for (log of logs)
                    console.log (log.date + ': ' + log.about + ': ' + log.message);
            }
            else{
                console.error ('No product to display.');
                process.exit (-1);
            }
        }
    }
    else{
        console.error ('No credentials. Please login or select a profile.');
        process.exit (-1);
    }
};

exports.applications = async function (argv){
    nonce.check (argv.nonce);
    nonce.add (argv.nonce);
    if (productApi && deployApi){
        let product = await productApi.get (argv.product_id);
        let depl = await deployApi.deploymentsProduct (argv.product_id);
        let apps = {};
        if (product){
            let existingApps = [];
            if (product.statistics && product.statistics.instant && product.statistics.instant.apps)
                existingApps = product.statistics.instant.apps;
            for (app of existingApps){
                apps[app.appId] = {
                    existingVersion: app.version
                };
                if (depl[app.appId])
                    apps[app.appId].availableVersion = depl[app.appId].version;
            }
            if (depl){
                for (let d in depl){
                    if (!apps[d])
                        apps[d] = {
                            availableVersion: depl[d].version
                        }
                }
            }
            if (argv.o === 'json'){
                console.log (apps);
            }
            else{
                let table = new Table({
                    head: ['App Id', 'Device Version', 'Available Version']
                }); 
                
                for (let a in apps){
                    let vals = [a, 
                                (apps[a].existingVersion)? apps[a].existingVersion: 'N/A',
                                (apps[a].availableVersion)? apps[a].availableVersion: 'N/A'];
                    table.push (vals);
                }
                console.log (table.toString());
            }
        }
        else{
            console.error ('No product found.');
            exit (-1);
        }
    }
    else{
        console.error ('No credentials. Please login or select a profile.');
        process.exit (-1);
    }
};
