const productApi = require ('../utils/api').products;
const Table = require ('cli-table');
exports.provision = async function (argv){
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
            console.error ('Could not provision product');
            process.exit (-1);
        }
    }
    else{
        console.error ('No credentials. Please login or select a profile.');
        process.exit (-1);
    }
};

exports.list = async function (argv){
    if (productApi){
        let products = await productApi.list (argv.cluster_id);
        if (argv.f === 'json')
            console.log (JSON.stringify (products, null, 3));
        else if (products && products.length > 0){
            let table = new Table({
                head: ['Name', 'Id', 'Type', 'Status', 'Registered']
            });
            for (product of products){
            table.push ([product.name, product.productId, product.type, product.status, product.registerType]);
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
    if (productApi){
        let response = await productApi.delete (argv.product_id);
        if (response){
        console.log ('Product deleted successfully.');
        }
        else{
            console.log ('Could not delete product.');
            process.exit (-1);
        }
    }
    else{
        console.error ('No credentials. Please login or select a profile.');
        process.exit (-1);
    }
};

exports.schedule = async function (argv){
    if (productApi){
        let response = await productApi.schedule({
            productId: argv.product_id,
            action: argv.action});
        if (response){
        console.log ('Action scheduled successfully.');
        }
        else{
            console.error ('Could not schedule action for product.');
            process.exit (-1);
        }
    }
    else{
        console.error ('No credentials. Please login or select a profile.');
        process.exit (-1);
    }
};

exports.unschedule = async function (argv){
    if (productApi){
        let response = await productApi.unschedule({
            productId: argv.product_id,
            action: argv.action});
        if (response){
        console.log ('Action unschedule successfully.');
        }
        else{
            console.log ('Could not unschedule action for product.');
            process.exit (-1);
        }
    }
    else{
        console.error ('No credentials. Please login or select a profile.');
        process.exit (-1);
    }
};

exports.edit = async function (argv){
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
            console.error ('Could not update product.');
            process.exit (-1);
        }
    }
    else{
        console.error ('No credentials. Please login or select a profile.');
        process.exit (-1);
    }
};

exports.getJson = async function (argv){
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
            console.log ('Could not add script to product.');
            process.exit (-1);
        }
    }
    else{
        console.error ('No credentials. Please login or select a profile.');
        process.exit (-1);
    }
};

exports.deleteScript = async function (argv){
    let params = {
        productId: argv.productId,
        name: argv.name
    }
    if (productApi){
        let response = await productApi.delScript (params);
        if (response)
            console.log ('Script removed successfully.');
        else{
            console.log ('Could not remove script from product.');
            process.exit (-1);
        }
    }
    else{
        console.error ('No credentials. Please login or select a profile.');
        process.exit (-1);
    }
};
