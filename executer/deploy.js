const deployApi = require('libiotway').get().deploy;
const Table = require('cli-table');
const tableBuilder = require('../utils/table');
const nonce = require('../utils/nonce');
const settings = require('../utils/settings');
const error = require('../utils/error');

//param/add
//param/del

exports.list = async function (argv) { //TODO make it print products

	nonce.check(argv.nonce);
	nonce.add(argv.nonce);
	if (deployApi) {
		let deployments = [];

		try {
			if (argv.app) {
				deployments = await deployApi.list(argv.app);
			}
			else if (argv.prod) {
			
				let array = [];
				deployments = await deployApi.deploymentsProduct(argv.prod);
				
				for (line of Object.entries(deployments)){
					let lineToInsert = {}
					lineToInsert.appId = line[0];
					if(line[1]){
						if(line[1].version) lineToInsert.version = line[1].version;
						if(line[1].target) lineToInsert.target = line[1].target;
						if(line[1].type) lineToInsert.type = line[1].type;
						if(line[1].rollback) lineToInsert.rollback = line[1].rollback;
					}
					array.push(lineToInsert);
				};
				deployments = array;
			}
			else {
				console.error('Must specify an option.');
				console.error('Run help to check for options');
				process.exit(-1);
			}
		}
		catch (err) {
			console.error('Could not get deployments. Check' + settings.errorFile + ' for more details.');
			error.addError(err);
			process.exit(-1);
		}

		if (argv.o === 'json')
			console.log(JSON.stringify(deployments, null, 3));
		else if (deployments && Object.keys(deployments).length > 0) {
			let format = argv.f;
			if (format === undefined)
				format = tableBuilder.getDefaultDeploy();
			else if (format.indexOf('wide') != -1) {
				format = tableBuilder.getWideDeploy();
			}
			let header = tableBuilder.header(format, 'deploy');
			let table = new Table({
				head: header
			});
			let targetIndex = format.indexOf('targetId');
			if (targetIndex != -1) {
				format.push('id');
				format.splice(targetIndex, 1);
			}
			for (let depl of deployments) {
				let values = [];
				
				for (let f of format) {
					if (f === 'rollback' && (depl[f] === null || depl[f] === undefined))
						values.push('');
					else{
						if(depl[f]) values.push(depl[f]);
						else values.push('');
					}
				}
				table.push(values);
			}
			console.log(table.toString());
		}
		else
			console.log('No deployments to display.');
	}
	else {
		console.error('No credentials. Please login or select a profile.');
		process.exit(-1);
	}
};

exports.versions = async function (argv) { //TOASK nu afiseaza nimic aici pe iotway deploy versions
	nonce.check(argv.nonce);
	nonce.add(argv.nonce);
	if (deployApi) {
		try {
			let versions = await deployApi.versions(argv.platform);
			if (versions)
				console.log(versions);
			else
				console.log('No versions to display');
		}
		catch (err) {
			console.error('Could not get deployment versions. Check' + settings.errorFile + ' for more details.');
			error.addError(err);
			process.exit(-1);
		}
	}
	else {
		console.error('No credentials. Please login or select a profile.');
		process.exit(-1);
	}
};

exports.edit = async function (argv) {
	nonce.check(argv.nonce);
	nonce.add(argv.nonce);
	//console.log(argv);
	let params = {
		appId: argv.appId,
		deployId: argv.deploy_id,
		network: argv.network,
		privileged: argv.privileged
	};
	if (deployApi) {
		try {
			await deployApi.edit(params);
			console.log('Deployment updated successfully.');
		}
		catch (err) {
			console.error('Could not update deployment. Check' + settings.errorFile + ' for more details.');
			error.addError(err);
			process.exit(-1);
		}
	}
	else {
		console.error('No credentials. Please login or select a profile.');
		process.exit(-1);
	}
};

exports.upgrade = async function (argv) {
	nonce.check(argv.nonce);
	nonce.add(argv.nonce);
	let params = {
		deployId: argv.deploy_id,
		appId: argv.app_id
	};
	if (deployApi) {
		try {
			await deployApi.upgrade(params);
			console.log('Deployment upgraded successfully.');
		}
		catch (err) {
			console.error('Could not upgrade deployment. Check' + settings.errorFile + ' for more details.');
			error.addError(err);
			process.exit(-1);
		}
	}
	else {
		console.error('No credentials. Please login or select a profile.');
		process.exit(-1);
	}
};

// exports.addParam = async function (argv){
//     nonce.check (argv.nonce);
//     nonce.add (argv.nonce);
//     let params = {
//         deployId: argv.id,
//         name: argv.name,
//         value: argv.values
//     };
//     if (deployApi){
//         let response = await deployApi.addParam (params);
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
//         deployId: argv.id,
//         name: argv.name
//     };
//     if (deployApi){
//         let response = await deployApi.delParam (params);
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

exports.get = async function (argv) { //TOASK merge doar daca userul e admin
	nonce.check(argv.nonce);
	nonce.add(argv.nonce);
	if (deployApi) {
		try {
			let deploy = await deployApi.get(argv.deploy_id);
			console.log(JSON.stringify(deploy, null, 3));
		}
		catch (err) {
			console.error('Could not get deployment. Check' + settings.errorFile + ' for more details.');
			error.addError(err);
			process.exit(-1);
		}
	}
	else {
		console.error('No credentials. Please login or select a profile.');
		process.exit(-1);
	}
};
