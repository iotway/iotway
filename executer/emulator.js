const settings = require ('../utils/settings');
const path = require ('path');
const mkdirp = require ('mkdirp');
const Table = require ('cli-table');
const tableBuilder = require ('../utils/table');
const fs = require ('fs-extra');
const semver = require ('semver');
const _ = require ('lodash');
const axios = require ('axios');
const yauzl = require ('yauzl');
const spawn = require ('child_process').spawn;
const express = require ('express');
const libiotway = require ('libiotway').get();
const error = require ('../utils/error');

const emulatorApi = libiotway.emulators;
const clusterApi = libiotway.clusters;
const productApi = libiotway.products;

const DIR = '';
const IMAGES = 'images';
const PRODUCTS = 'products';

function getEmulatorsDir (item = DIR)
{
	let emulatorsPath = process.env.WYLIODRIN_EMULATORS_DIR || path.join (settings.baseDir, 'emulators', item);
	mkdirp.sync (emulatorsPath);
	return emulatorsPath;
}

function getEmulator (productId)
{
	let emulator = null;
	try
	{
		emulator = JSON.parse (fs.readFileSync (path.join (getEmulatorsDir(PRODUCTS), productId, 'emulator.json')));
		if (!emulator) throw new Error ();
	}
	catch (e)
	{
		console.error ('Emulator '+productId+' does not exist');
		emulator = null;
	}
	return emulator;
}

async function getEmulatorLocalPlatform (platform)
{
	let emulator = null;
	try
	{
		emulator = JSON.parse (fs.readFileSync (path.join (getEmulatorsDir(IMAGES), platform, 'emulator.json')));
		if (emulator)
		{
			if (!emulator.qemu) emulator.qemu = {};
			_.assign (emulator.qemu, (await readEmulatorImage (path.join (getEmulatorsDir(IMAGES), platform, 'emulator.zip'))));
		}
	}
	catch (e)
	{
		console.error ('Platform '+platform+' is not local, please download');
		emulator = null;
	}
	return emulator;
}

function isEmulatorForProduct (productId)
{
	return fs.existsSync (path.join (getEmulatorsDir(PRODUCTS), productId));
}

async function getImages ()
{
	let emulatorsDir = getEmulatorsDir (IMAGES);
	let emulatorsImages = [];
	let folders = fs.readdirSync (emulatorsDir);
	for (let folder of folders)
	{
		if (folder !== '.' && folder !== '..')
		{
			let image = await getEmulatorLocalPlatform (folder);
			if (image)
			{
				emulatorsImages.push (image);
			}
		}
	}
	return emulatorsImages;
}

async function getEmulators ()
{
	let emulatorsDir = getEmulatorsDir (PRODUCTS);
	let emulators = [];
	let folders = fs.readdirSync (emulatorsDir);
	for (let folder of folders)
	{
		if (folder !== '.' && folder !== '..')
		{
			let emulator = await getEmulator (folder);
			if (emulator)
			{
				_.assign (emulator, {
					productId: folder
				});
				emulators.push (emulator);
			}
		}
	}
	return emulators;
}

async function getPlatform (platform)
{
	let emulatorsPlatforms = await getPlatforms ();
	return _.find (emulatorsPlatforms, (emulatorPlatform) => {
		return platform === emulatorPlatform.platform;
	});
}

async function getPlatforms ()
{
	if (emulatorApi){
		try{
			let platforms = await emulatorApi.platforms ();
			if (platforms === null)
			{
				console.log ('Unable to load platforms');
			}
			return platforms;
		}
		catch (err){
			console.error ('Could not get platforms. Check' + settings.errorFile + ' for more details.');
			error.addError (err);
			process.exit (-1);
		}
	}
	else{
		console.error ('No credentials. Please login or select a profile.');
		process.exit (-1);
	}
}

async function downloadImage (platform)
{
	let downloadDir = path.join (getEmulatorsDir (IMAGES), platform.platform);
	mkdirp.sync (downloadDir);
	console.log ('Downloading emulator image from '+platform.link);
	const response = await axios({
		method: 'GET',
		url: platform.link,
		responseType: 'stream'
	});
	
	let downloadTemp = path.join (downloadDir, 'emulator_temp.zip');

	// pipe the result stream into a file on disc
	response.data.pipe(fs.createWriteStream(downloadTemp));

	// return a promise and resolve when download finishes
	await new Promise((resolve, reject) => {
		response.data.on('end', () => {
			resolve();
		});
	
		response.data.on('error', () => {
			reject();
		});
	});
	console.log ('Verifying emulator image for platform '+platform.platform);
	try
	{
		let entries = await readEmulatorImage (downloadTemp);
		if (!entries.hda) throw new Error ('no hda found');
		fs.renameSync (downloadTemp, path.join (downloadDir, 'emulator.zip'));
		fs.writeFileSync (path.join (downloadDir, 'emulator.json'), JSON.stringify(platform, null, 3));
	}
	catch (err)
	{
		fs.unlinkSync (downloadTemp);
		console.log ('Download error for platform '+platform.platform+' '+err.message);
	}
}

async function runEmulator (productId)
{
	let emulatorSetup = await getEmulator (productId);
	if (emulatorSetup)
	{
		let product = null;
		try
		{
			product = await productApi.get (productId);
		}
		catch (err)
		{
			console.error ('Could not get product. Check' + settings.errorFile + ' for more details.');
			error.addError (err);
		}
		let server = express ();
		server.get ('/wyliodrin.json', function (req, res)
		{
			console.log ('Sending wyliodrin.json');
			res.sendFile (path.join (getEmulatorsDir (PRODUCTS), productId, 'wyliodrin.json'));
		});
		let port = 0;
		await new Promise ((resolve, reject) =>
		{
			let listener = server.listen (port, (err) => 
			{
				if (err) reject (err);
				else
				{
					port = listener.address().port;
					console.log ('Server listening port '+port);
					resolve ();
				}
			});
		});
		let title = productId;
		if (product && product.name) title = product.name;
		let parameters = ['-name', title, '-net', 'nic', '-net', 'user,hostfwd=tcp::5022-:22,guestfwd=tcp:10.0.2.17:8000-tcp:127.0.0.1:'+port];
		if (emulatorSetup.qemu.machine) parameters.push ('-M', emulatorSetup.qemu.machine);
		if (emulatorSetup.qemu.cpu) parameters.push ('-cpu', emulatorSetup.qemu.cpu);
		if (emulatorSetup.qemu.hda) parameters.push ('-hda', emulatorSetup.qemu.hda);
		if (emulatorSetup.qemu.mem) parameters.push ('-m', emulatorSetup.qemu.mem);
		if (emulatorSetup.qemu.cmdline) parameters.push ('-append', emulatorSetup.qemu.cmdline);
		if (emulatorSetup.qemu.kernel) parameters.push ('-kernel', emulatorSetup.qemu.kernel);
		if (emulatorSetup.qemu.dtb) parameters.push ('-dtb', emulatorSetup.qemu.dtb);
		let emulator = spawn ('qemu-system-'+emulatorSetup.qemu.system, parameters, {
			cwd: path.join (getEmulatorsDir (PRODUCTS), productId)
		});
		emulator.stdout.on ('data', function (data)
		{
			process.stdout.write (data);
		});
		emulator.stderr.on ('data', function (data)
		{
			process.stderr.write (data);
		});
		emulator.on ('error', function (e)
		{
			console.log ('Emulator failed to start with error '+e.message);
			if (e.message.indexOf ('ENOENT')>=0) console.log ('Is QEMU installed?');
			process.exit (-1);
		});
		emulator.on ('exit', function (e) {
			process.exit (e);
		});
	}
}

async function newEmulator (clusterId, productId, type)
{
	if (!isEmulatorForProduct (productId))
	{
		let provisioningFile = null;
		if (_.isObject (clusterId))
		{
			provisioningFile = clusterId;
			clusterId = provisioningFile.clusterId;
		}
		if (!type) type = 'beta';
		if (!provisioningFile){
			if (clusterApi){
				try{
					provisioningFile = await clusterApi.getProvisioningFile(clusterId);
				}
				catch (err){
					console.error ('Could not get provisoning file. Check' + settings.errorFile + ' for more details.');
					error.addError (err);
					process.exit (-1);
				}
			}
			else{
				console.error ('No session. Please login or select a different profile.');
			}
		}
		if (provisioningFile){
			let platform = provisioningFile.platform;
			if (!platform) 
			{
				if (clusterApi){
					try{
						let cluster = await clusterApi.get(clusterId);
						let emulatorPlatform = await getPlatform (cluster.platform);
						if (emulatorPlatform)
						{
							await downloadImage (emulatorPlatform);
							platform = await getEmulatorLocalPlatform (cluster.platform);
						}
					}
					catch (err){
						console.error ('Could not get cluster. Check' + settings.errorFile + ' for more details.');
						error.addError (err);
						process.exit (-1);
					}
				}
			}
			if (platform)
			{
				provisioningFile.id = productId;
				provisioningFile.type = type;
				provisioningFile.hardware = 'emulator';
				// TODO add parameters
				let emulatorDir = path.join (getEmulatorsDir (PRODUCTS), productId);
				mkdirp.sync (emulatorDir);
				console.log ('Writing provisioning file');
				fs.writeFileSync (path.join (emulatorDir, 'wyliodrin.json'), JSON.stringify (provisioningFile, null, 3));
				console.log ('Setting up the emulator');
				await setupEmulator (platform, productId);
			}
			else
			{
				console.log ('There is no emulator available for the platform.');
			}
		}
		else
		{
			console.log ('There is no cluster with id '+clusterId);
		}
	}
	else
	{
		console.log ('There is an emulator for product with productId '+productId+'. Please delete it first and then make a new one.');
	}
}

module.exports.images = async (argv) => {
	let images = await getImages ();
	if (argv.o === 'json')
		console.log (JSON.stringify (images, null, 3));
	else if (images && images.length > 0){
		let format = argv.f;
		if (format === undefined)
			format = tableBuilder.getDefaultEmulatorImage ();
		else if (format.indexOf ('wide') != -1){
			format = tableBuilder.getWideEmulatorImage ();
		}
		let header = tableBuilder.header (format, 'emulatorImage');
		let table = new Table({
			head: header
		});  
		for (let image of images){
			let values = [];
			for (let f of format){
				if (image[f])
				{
					values.push (image[f]);
				}
				else
				if (image.qemu && image.qemu[f])
				{
					values.push (image.qemu[f]);
				}
				else{
					values.push ('N/A');
				}     
			}
			table.push (values);
		}
		console.log (table.toString());
	}
	else
		console.log ('No emulator images to display.');
};

module.exports.list = async (argv) => {
	let emulators = await getEmulators ();
	if (argv.o === 'json')
		console.log (JSON.stringify (emulators, null, 3));
	else if (emulators && emulators.length > 0){
		let format = argv.f;
		if (format === undefined)
			format = tableBuilder.getDefaultEmulator ();
		else if (format.indexOf ('wide') != -1){
			format = tableBuilder.getWideEmulator ();
		}
		let header = tableBuilder.header (format, 'emulator');
		let table = new Table({
			head: header
		});  
		for (let image of emulators){
			let values = [];
			for (let f of format){
				if (image[f])
				{
					values.push (image[f]);
				}
				else
				if (image.qemu && image.qemu[f])
				{
					values.push (image.qemu[f]);
				}
				else{
					values.push ('N/A');
				}     
			}
			table.push (values);
		}
		console.log (table.toString());
	}
	else
		console.log ('No emulators to display.');
};

module.exports.platforms = async (argv) => {
	let platforms = await getPlatforms ();
	if (argv.o === 'json')
		console.log (JSON.stringify (platforms, null, 3));
	else if (platforms && platforms.length > 0){
		let format = argv.f;
		if (format === undefined)
			format = tableBuilder.getDefaultEmulatorPlatform ();
		else if (format.indexOf ('wide') != -1){
			format = tableBuilder.getWideEmulatorPlatform ();
		}
		let header = tableBuilder.header (format, 'emulatorPlatform');
		let table = new Table({
			head: header
		});  
		for (let platform of platforms){
			let values = [];
			for (let f of format){
				if (platform[f])
				{
					values.push (platform[f]);
				}
				else
				if (platform.qemu && platform.qemu[f])
				{
					values.push (platform.qemu[f]);
				}
				else{
					values.push ('N/A');
				}     
			}
			table.push (values);
		}
		console.log (table.toString());
	}
	else
		console.log ('No emulator platforms to display.');
};

function readEmulatorImage (filename)
{
	return new Promise ((resolve, reject) => {
		let entries = {
			
		};
		yauzl.open (filename, function (err, zipfile)
		{
			if (err)
			{
				reject (err);
			}
			else
			{
				zipfile.on ('entry', (entry) => 
				{
					if (path.extname(entry.fileName) === '.qcow') entries.hda = entry.fileName;
					else
					if (path.extname (entry.fileName) === '.kernel') entries.kernel = entry.fileName;
					else
					if (path.extname (entry.fileName) === '.dtb') entries.dtb = entry.fileName;
				});
				zipfile.on ('end', () => {
					resolve (entries);
				});
			}
		});
	});
}

async function setupEmulator (platform, productId)
{
	let emulatorDir = path.join (getEmulatorsDir (PRODUCTS), productId);
	let emulatorImage = path.join (getEmulatorsDir (IMAGES), platform, 'emulator.zip');
	//let emulatorPlatform = path.join (getEmulatorsDir (IMAGES), platform, 'emulator.json');
	try
	{
		await new Promise ((resolve, reject) => {
			yauzl.open (emulatorImage, {lazyEntries: true}, function (err, zipfile)
			{
				if (err)
				{
					reject (err);
				}
				else
				{
					zipfile.on ('entry', (entry) => 
					{
						console.log ('Unzipping '+entry.fileName);
						if (/\/$/.test(entry.fileName)) {
							// Directory file names end with '/'.
							// Note that entires for directories themselves are optional.
							// An entry's fileName implicitly requires its parent directories to exist.
							zipfile.readEntry();
						} else {
						// file entry
							zipfile.openReadStream(entry, function(err, readStream) {
								if (err) reject (err);
								readStream.on('end', function() {
									zipfile.readEntry();
								});
								readStream.pipe(fs.createWriteStream (path.join (emulatorDir, entry.fileName)));
							});
						}
					});
					zipfile.on ('end', () => {
						resolve ();
					});
					zipfile.readEntry ();
				}
			});
		});
		fs.writeFileSync (path.join (emulatorDir, 'emulator.json'), JSON.stringify ((await getEmulatorLocalPlatform (platform)), null, 3));
	}
	catch (e)
	{
		console.log ('Error while setting up emulator for platform '+platform+': '+e.message);
	}
}

function delEmulator (projectId)
{
	let emulatorDir = path.join (getEmulatorsDir (PRODUCTS), projectId);
	fs.removeSync (emulatorDir);
}

module.exports.update = async (argv) => {
	let images = await getImages ();
	let platforms = await getPlatforms ();
	if (argv.platform !== 'all')
	{
		platforms = _.filter (platforms, function (platform)
		{
			return platform.platform === argv.platform;
		});
	}
	if (platforms.length>0)
	{
		for (let platform of platforms)
		{
			let update = false;
			let image = _.find (images, function(image)
			{
				return image.platform === platform.platform;
			});
			if (image)
			{
				if (semver.lt (image.version, platform.version))
				{
					update = true;	
				}
				else
				{
					console.log ('Emulator for platform '+platform.platform+' is up to date');
				}
			}
			else
			{
				update = true;
			}
			if (update)
			{
				console.log ('Updating platform '+platform.platform+' to version '+platform.version);
				await downloadImage (platform);
			}
			console.log ('');
		}
	}
	else
	{
		console.log ('There si no emulator for platform '+argv.platform);
	}
};

module.exports.newEmulator = async (argv) => {
	try
	{
		await newEmulator (argv.clusterId, argv.productId, argv.type);
	}
	catch (e)
	{
		console.log ('Error while making the emulator: '+e.message);
	}
};

module.exports.runEmulator = async (argv) => {
	try
	{
		await runEmulator (argv.productId);
	}
	catch (e)
	{
		console.log ('Error while running the emulator: '+e.message);
	}
};

module.exports.delEmulator = async (argv) => {
	try
	{
		await delEmulator (argv.productId);
	}
	catch (e)
	{
		console.log ('Error while deleting the emulator: '+e.message);
	}
};