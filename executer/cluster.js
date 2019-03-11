const clusterApi = require ('libiotway').get().clusters;
const Table = require ('cli-table');
const tableBuilder = require ('../utils/table');
const nonce = require ('../utils/nonce');
const settings = require ('../utils/settings');
const error = require ('../utils/error');

exports.new = async function (argv){
	nonce.check (argv.nonce);
	nonce.add (argv.nonce);
	let params = {
		authKey: true,
		name: argv.name,
		openRegister: argv.openRegister,
		platform: argv.platform,
		deployer: argv.deployer,
		filterRegister: argv.filterRegister
	};
	if (argv.publicKey && argv.privateKey){
		params.key = {
			public: argv.publicKey,
			private: argv.privateKey
		};
	}
	if (argv.openRegister && argv.filterRegister && argv.registerProducts){
		params.filterRegisterProducts = argv.registerProducts;
	}
	if (clusterApi){
		try{
			await clusterApi.new (params);
			console.log ('Cluster created successfully.');
		}
		catch (err){
			console.error ('Could not create cluster. Check' + settings.errorFile + ' for more details.');
			error.addError (err);
			process.exit (-1);
		}
	}
	else{
		console.error ('No session. Please login or select a different profile.');
		process.exit (-1);
	}
};

exports.list = async function (argv){
	nonce.check (argv.nonce);
	nonce.add (argv.nonce);
	if (clusterApi){
		try{
			clusters = await clusterApi.list ();
			if (argv.o === 'json')
				console.log (JSON.stringify (clusters, null, 3));
			else if (clusters && clusters.length > 0){
				let format = argv.f;
				if (format === undefined)
					format = tableBuilder.getDefaultCluster ();
				else if (format.indexOf ('wide') != -1){
					format = tableBuilder.getWideCluster ();
				}
				let header = tableBuilder.header (format, 'cluster');
				let table = new Table({
					head: header
				});            
				for (cluster of clusters){
					let values = [];
					for (f of format){
						values.push (cluster[f]);
					}
					table.push (values);
				}
				console.log (table.toString());
			}
			else
				console.log ('No clusters to display.');
		}
		catch (err){
			console.error ('Could not get clusters. Check' + settings.errorFile + ' for more details.');
			error.addError (err);
			process.exit (-1);
		} 
	}
	else{
		console.error ('No session. Please login or select a different profile.');
		process.exit (-1);
	}
};

exports.get = async function (argv){
	nonce.check (argv.nonce);
	nonce.add (argv.nonce);
	if (clusterApi){
		try{
			let cluster = await clusterApi.get (argv.cluster_id);
			console.log (JSON.stringify (cluster, null, 3));
		}
		catch (err){
			console.log ('Cluster not found.');
			error.addError (response.err);
		}
	}
	else{
		console.error ('No session. Please login or select a different profile.');
		process.exit (-1);
	}
};

// exports.getScripts = async function (argv){
//     nonce.check (argv.nonce);
//     nonce.add (argv.nonce);
//     if (clusterApi){
//         let cluster = await clusterApi.get (argv.cluster_id);
//         if (argv.o === 'json')
//             console.log (JSON.stringify (cluster, null, 3));
//         if (cluster){
//             let table = new Table({
//                 head: ['Name', 'Script']
//             });
//             if (cluster.scripts){
//                 for (script in cluster.scripts){
//                     if (cluster.scripts[script].length > 0)
//                         table.push ([script, cluster.scripts[script]]);
//                 }
//             }
//             console.log (table.toString());
//         }
//         else
//             console.log ('Cluster not found.');
//     }
//     else{
//         console.error ('No credentials. Please login or select a profile.');
//         process.exit (-1);
//     }
// };

exports.delete = async function (argv){
	nonce.check (argv.nonce);
	nonce.add (argv.nonce);
	if (clusterApi){
		try{
			await clusterApi.delete (argv.cluster_id);
			console.log ('Cluster deleted successfully.');
		}
		catch (err){
			console.error ('Could not delete cluster. Check' + settings.errorFile + ' for more details.');
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
	if (clusterApi){
		try{
			await clusterApi.edit (params);
			console.log ('Cluster updated.');
		}
		catch (err){
			console.error ('Could not update cluster. Check ' + settings.errorFile + ' file for more details.');
			error.addError (err);
			process.exit (-1);
		}
	}
	else{
		console.error ('No credentials. Please login or select a profile.');
		process.exit (-1);
	}
};

// exports.addScript = async function (argv){
//     nonce.check (argv.nonce);
//     nonce.add (argv.nonce);
//     let params = {
//         clusterId: argv.id,
//         name: argv.name,
//         value: argv.command
//     }
//     if (clusterApi){
//         let response = await clusterApi.addScript (params);
//         if (response)
//             console.log ('Script added successfully.');
//         else{
//             console.error ('Could not add script to cluster.');
//             process.exit (-1);
//         }
//     }
//     else{
//         console.error ('No credentials. Please login or select a profile.');
//         process.exit (-1);
//     }
// };

// exports.deleteScript = async function (argv){
//     nonce.check (argv.nonce);
//     nonce.add (argv.nonce);
//     let params = {
//         clusterId: argv.id,
//         name: argv.name
//     }
//     if (clusterApi){
//         let response = await clusterApi.delScript (params);
//         if (response)
//             console.log ('Script removed successfully.');
//         else{
//             console.error ('Could not remove script from cluster. Check log file for more details.');
//             process.exit (-1);
//         }
//     }
//     else{
//         console.error ('No credentials. Please login or select a profile.');
//         process.exit (-1);
//     }
// };

exports.getJson = async function (argv){
	nonce.check (argv.nonce);
	nonce.add (argv.nonce);
	if (clusterApi){
		try{
			let file = await clusterApi.getWyliodrinJSON (argv.clusterId);
			console.log (JSON.stringify (file, null, 3));
		}
		catch (err){
			console.error ('Could not get file. Check' + settings.errorFile + ' for more details.');
			error.addError (err);
		}
	}
	else{
		console.error ('No credentials. Please login or select a profile.');
		process.exit (-1);
	}
};