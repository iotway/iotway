const clusterApi = require ('../utils/api').clusters;
const Table = require ('cli-table');
exports.new = async function (argv){
    let params = {
        authKey: true,
        name: argv.name,
        openRegister: argv.openRegister,
        platform: argv.platform,
        deployer: argv.deployer,
        filterRegister: argv.filterRegister
    }
    if (argv.publicKey && argv.privateKey){
        params.key = {
            public: argv.publicKey,
            private: argv.privateKey
        }
    }
    if (argv.openRegister && argv.filterRegister && argv.registerProducts){
        params.filterRegisterProducts = argv.registerProducts;
    }
    if (await clusterApi.new (params))
        console.log ('Cluster created successfully.');
    else
        console.error ('Could not create cluster. ');
};

exports.list = async function (){
    let clusters = await clusterApi.list ();
    if (clusters && clusters.length > 0){
        let table = new Table({
            head: ['Name', 'Id', 'Open', 'Filter']
        });
        for (cluster of clusters){
           let openRegister = cluster.openRegister? 'yes':'no';
           let filterRegister = cluster.filterRegister? 'yes':'no';
           table.push ([cluster.name, cluster.clusterId, openRegister, filterRegister]);
        }
        console.log (table.toString());
    }
    else
        console.log ('No clusters to display.');
};

exports.get = async function (argv){
    let cluster = await clusterApi.get (argv.cluster_id);
    if (cluster){
      console.log (JSON.stringify (cluster, null, 3));
    }
    else
        console.log ('Cluster not found.');
};

exports.getScripts = async function (argv){
    let cluster = await clusterApi.get (argv.cluster_id);
    if (cluster){
        let table = new Table({
            head: ['Name', 'Script']
        });
        if (cluster.scripts){
            for (script in cluster.scripts){
                if (cluster.scripts[script].length > 0)
                    table.push ([script, cluster.scripts[script]]);
            }
        }
        console.log (table.toString());
    }
    else
        console.log ('Cluster not found.');
};

exports.delete = async function (argv){
    let response = await clusterApi.delete (argv.cluster_id);
    if (response){
      console.log ('Cluster deleted successfully.');
    }
    else
        console.log ('Could not delete cluster');
};

exports.edit = async function (argv){
    let params = {
        clusterId: argv.cluster_id,
        name: argv.name,
        wyliodrin: {
            deployer: argv.deployer
        },
        openRegister: argv.openRegister,
        filterRegister: argv.filterRegister,
        filterRegisterProducts: argv.registerProducts
    };

    if (argv.updateHours || argv.updateFrom || argv.updateTo || argv.updateInterval){
        params.update = {
            betweenHours: argv.updateHours,
            from: argv.updateFrom,
            to: argv.updateTo,
            interval: argv.updateInterval
        };
    }

    let response = await clusterApi.edit (params);

    if (response){
        console.log ('Cluster updated.');
    }
    else{
        console.log ('Could not update cluster.');
    }
};

exports.addScript = async function (argv){
    let scripts = {};
    scripts[argv.name] = argv.command;
    let params = {
        clusterId: argv.clusterId,
        scripts: scripts,
        wyliodrin: {}
    }

    let response = await clusterApi.edit (params);
    if (response)
        console.log ('Script added successfully.');
    else
        console.log ('Could not add script to cluster.');
};

exports.deleteScript = async function (argv){
    let scripts = {};
    scripts[argv.name] = '';
    let params = {
        clusterId: argv.clusterId,
        scripts: scripts,
        wyliodrin: {}
    }

    let response = await clusterApi.edit (params);
    if (response)
        console.log ('Script removed successfully.');
    else
        console.log ('Could not remove script from cluster.');
};

exports.getJson = async function (argv){
    let file = await clusterApi.getWyliodrinJSON (argv.clusterId);
    if (file)
        console.log (JSON.stringify (file, null, 3));
    else
        console.log ('Could not get file.');
};