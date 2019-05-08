const Table = require ('cli-table');
const fs = require ('fs-extra');
const path = require ('path');
const mustache = require ('mustache');
const child_process = require ('child_process');
const readline = require('readline');
const readlineSync = require('readline-sync');
const semver = require('semver');
const _ = require ('lodash');
const libwyliodrin = require ('libiotway').get();

const profileService = require ('../utils/profile');
const tableBuilder = require ('../utils/table');
const socketService = require ('../utils/socket');
const nonce = require ('../utils/nonce');
const pressKey = require ('../utils/waitKey');
const error = require ('../utils/error');
const errorFile = require ('../utils/settings').errorFile;

const appApi = libwyliodrin.apps;
const productApi = libwyliodrin.products;
const settingsApi = libwyliodrin.settings;
const projectApi = libwyliodrin.projects;
const userApi = libwyliodrin.users;

const projectSettingsFile = 'iotway.json';
const git = require('../utils/git');

const projectTemplates = 'project_templates';

//parse project name and replace all illegal characters with _
function normalizeProjectName (name){
	name = name.toLowerCase();
	let chars = name.split ('');
	chars = _.map (chars, (c)=>{
		if (c.toLowerCase() !== c.toUpperCase())
			return c;
		return '_';
	});
	return chars.join('');
}

exports.init = async function (argv){
	nonce.check (argv.nonce);
	nonce.add (argv.nonce);
	let projectFolder;
	if (!argv.folder){
		projectFolder = process.cwd();
		let contents = fs.readdirSync (projectFolder);
		if ((contents.length === 1 && contents[0] !== 'project.log') || contents.length !== 0){
			error.addError ('Project init is not run in an empty folder');
			console.error ('Directory not empty. Please run command in an empty directory');
			process.exit (-1);
		}
	}
	else{
		projectFolder = path.resolve (argv.folder);
	}

	let settings;
	if (settingsApi){
		try{
			settings = await settingsApi.get();
		}
		catch (err){
			console.error ('Could not get settings. Check' + errorFile + ' for more details.');
			error.addError (err);
			process.exit (-1);
		}
	}
	else{
		console.error ('No session. Please login or select a different profile.');
		process.exit (-1);
	}
	
	if (process.env.WYLIODRIN_PROJECT_ID){
		console.log ('Using environment configurations');
		if (projectApi){
			try{
	 			let onlineProject = await projectApi.get (process.env.WYLIODRIN_PROJECT_ID);
				if (onlineProject){
					project = {
						name: normalizeProjectName (onlineProject.name),
						appId: onlineProject.appId,
						language: onlineProject.language,
						id: onlineProject.projectId,
						platform: onlineProject.platform,
						ui: onlineProject.ui
					};
				}
				else{
					console.error ('Project not found.');
					process.exit (-1);
				}
			}
			catch (err){
				console.error ('Could not get project info. Check' + errorFile + ' for more details.');
				error.addError (err);
				process.exit (-1);
			}
		}
		else {
			console.error ('No session. Please login or select a different profile.');
			process.exit (-1);
		}
	} 
	else{
		let projectName = argv.name;
		let projectPlatform = argv.platform;
		let projectAppId = argv.appId;
		let projectUi = argv.ui;
		let projectLanguage = argv.language;

		if (projectName === undefined || projectName.length === 0)
			projectName = readlineSync.question ('project name: ').trim(); 
			
		if (projectName.length === 0){
			process.exit (-1);
		}
			
		projectName = normalizeProjectName (projectName);

		if (projectPlatform === undefined){ 
			if (settings){
				let platforms = Object.keys(settings.PLATFORM);
				projectPlatform = readlineSync.question ('platform (choose between ' + platforms.join() + '): ');
			}
			else{
				projectPlatform = readlineSync.question ('platform (log in or check website for supported platforms): ');
			}
		}

		if (projectLanguage === undefined){
			if (settings && settings.PLATFORM[projectPlatform] && settings.PLATFORM[projectPlatform].ui[projectUi]){
				let languages = settings.PLATFORM[projectPlatform].ui[projectUi].language;
				projectLanguage = readlineSync.question ('project language (choose between '+Object.keys(languages).join()+'): ');
			}
			else{
				projectLanguage = readlineSync.question ('project language (log in or check website for supported platforms): ');
			}
		}
		project = {
			name: projectName,
			appId: projectAppId,
			language: projectLanguage,
			platform: projectPlatform,
			ui: projectUi
		};
	}

	if (project.appId.substring (0, 5) !== 'local'){
		if (appApi){
			try{
				let app = await appApi.get (project.appId);

				if (!app){
					console.error ('Please provide a valid application id.');
					process.exit (-1);
				}
			}
			catch (err){
				console.error ('Could not get app id. Check' + errorFile + ' for more details.');
				error.addError (err);
				process.exit (-1);
			}
		}
	}

	//download project structure
	try{
		console.log ('Downloading project structure.');
		console.log ('Git is required');
		await git.downloadTemplate (projectFolder);
	}
	catch (err){
		console.error ('Could not download project structure. Make sure git is installed. Check' + errorFile + ' for more details.');
		error.addError (err);
		process.exit (-1);
	}

	//Generate project structure
	try{
		fs.copySync (path.join (projectFolder, projectTemplates, project.language), projectFolder);
	}
	catch (err){
		console.error ('Could not generate project structure. Ensure the specified programming language is valid.');
		console.error ('Check' + errorFile + ' for more details.');
		error.addError (err.stack);
		process.exit (-1);
	}

	//Generate package.json for js projects
	if (project.language === 'nodejs'){
		try{
			let package = fs.readFileSync (path.join(projectFolder, 'src', 'package.json'), 'utf8');
			let user = {
				email: '',
				name: ''
			};
			
			if (userApi){
				try{
					let onlineUser = await userApi.get ();
					if (onlineUser){
						user = onlineUser;
					}
				}
				catch (err){
					console.error ('Cannot get user data. Check' + errorFile + ' for more details.');
					error.addError (err);
				}
			}
			
			let packageData = {
				project: project,
				user: user
			};
			package = mustache.render (package, packageData);
			
			try{
				fs.writeFileSync (path.join(projectFolder, 'src', 'package.json'), package);
			}
			catch (err){
				console.error ('Filesystem error. Could not generate package.json file.');
				console.error ('Check '+errorFile+' for more details.');
				error.addError (err.stack);
			}
		}
		catch (err){
			console.error ('No package.json template. Did not generate package.json file');
		}
	}
	
	//Generate dockerfile if necessary
	if (settings){
		if (settings.PLATFORM[project.platform].docker.platform !== 'none'){
			try{
				let dockerFile = fs.readFileSync (path.join (projectFolder, 'docker'), 'utf8');
				let docker = ' ';
				let libraries = fs.readFileSync (path.join (projectFolder, 'docker_libraries', project.language), 'utf8');
				
				let dockerData = {
					REPOSITORY: settings.REPOSITORY,
					DEPLOYER_DOMAIN: settings.DEPLOYER,
					project: project,
					arm: (settings.PLATFORM[project.platform].docker.platform === 'arm')? true: false,
					dockerfile: docker,
					libraries: libraries,
					repositoryVersion: settings.PLATFORM[project.platform].ui[project.ui].language[project.language].tag
				};
				dockerFile = mustache.render (dockerFile, dockerData);
				fs.writeFileSync (path.join(projectFolder, 'dockerfile'), dockerFile);
					
			}
			catch (err){
				console.log ('Could not generate dockerfile');
				console.error ('Check '+errorFile+' for more details.');
				error.addError (err.stack);
			}
		}
	}
	else{
		console.error ('No settings available. Did not generate dockerfile');
	}

	//remove all structure
	fs.removeSync(path.join (projectFolder, 'docker_libraries'));
	fs.removeSync(path.join (projectFolder, projectTemplates));	
	fs.removeSync(path.join (projectFolder, 'docker'));
	console.log ('Project structure created successfully.')
}

function print (data, prefix, channel){
	let lines = data.toString().split ('\n');
	if (lines[lines.length-1] === '\n'){
		lines.splice (lines.length-1, 1);
	}
	for (let l of lines){
		if (l.length > 0)
			channel.write (prefix+'> '+l+'\n');
	}
}


function build(projectSettings, settings, version, sessionId, productId, cb){
	//Run make
	console.log ('make');
	try{
		let make = child_process.spawn ('make', {
			env: _.assign ({}, process.env, settings.PLATFORM[projectSettings.platform].options)
		});
		make.stdout.on ('data', (data)=>{
			print (data, 'MAKE', process.stdout);
		});
		make.stderr.on ('data', (data)=>{
			print (data, 'MAKE', process.stderr);
		});
		make.on ('exit', async (code)=>{
			if (code === 0){

				//generate binary file if needed
				if (productId && settings.PLATFORM[projectSettings.platform].options && settings.PLATFORM[projectSettings.platform].options.binary){
					let options = settings.PLATFORM[projectSettings.platform].options.binary;
					let newFile = path.join (path.dirname (options), productId + path.extname (options));
					try{
						fs.copySync (path.join (process.cwd(), options), path.join (process.cwd(), newFile));
						if (sessionId && projectSettings.id){
							await productApi.run ({
								session: sessionId,
								productId: productId,
								projectId: projectSettings.id
							});
						}
					}
					catch (err){
						console.error ('Build error. Check '+errorFile+' for more details.');
						error.addError (err.stack);
						process.exit (-1);
					}
				}

				//build dockerfile if needed
				let buildFolder = path.join (process.cwd(), 'build');
				if (settings.PLATFORM[projectSettings.platform].docker.platform !== 'none'){
					try{
						// Build docker image
						try{
							console.log ('Building docker image.');
							let dockerBuild = child_process.spawn ('docker', ['build', '-t', settings.REPOSITORY+'/'+projectSettings.appId+':'+version, '.'], {cwd: buildFolder});
							dockerBuild.stdout.on ('data', (data)=>{
								print (data, 'DOCKER BUILD', process.stdout);
							});
							dockerBuild.stderr.on ('data', (data)=>{
								print (data, 'DOCKER BUILD', process.stderr);
							});
							dockerBuild.on ('exit', (code)=>{
								cb (code);
							});
						}
						catch (err){
							console.error ('Docker error. You might need to log in or check '+errorFile+' for more details.');
							error.addError (err.stack);
							process.exit (-1);
						}
					}
					catch (err){
						console.error ('Build error. Check '+errorFile+' for more details.');
						error.addError (err.stack);
						process.exit (-1);
					}
				}
			}
			else{
				console.error ('Make error.');
				process.exit (-1);
			}
		});
	}
	catch (err){
		console.error ('Could not build project.');
		console.error ('Check ' + errorFile + 'for more details');
		error.addError (err);
		process.exit (-1);
	}
}

function publish (settings, projectSettings, version, semanticVersion, description, cb){
	let appId = projectSettings.appId;
	if (settings.PLATFORM[projectSettings.platform].docker.platform !== 'none'){
		let buildFolder = path.join(process.cwd(), 'build');
		//Push docker image
		try{
			console.log ('Pushing docker image. Please wait.');
			let dockerPush = child_process.spawn ('docker', ['push', settings.REPOSITORY+'/'+appId+':'+version], {cwd: buildFolder});

			dockerPush.stdout.on ('data', (data)=>{
				print (data, 'DOCKER PUSH', process.stdout);
			});
			dockerPush.stderr.on ('data', (data)=>{
				print (data, 'DOCKER PUSH', process.stderr);
			});
			dockerPush.on ('exit', async (code)=>{
				if (code === 0 && version !== 'dev'){
					if (semanticVersion === undefined){
						let projectSettings = await getProjectSettings (process.cwd());
						if (projectSettings.language === 'nodejs'){
							let packagePath = path.join(process.cwd(), 'package.json');
							try{
								let projectData = require (packagePath);
								let projectVersion = projectData.version;
								if (projectVersion)
									semanticVersion = semver.valid (semver.coerce (projectVersion));
							}
							catch (e){
								semanticVersion = undefined;
							}
						}
					}
					if (appApi){
						try{
							await appApi.versions (appId);
							await appApi.editVersion (appId, version, {
								semver: semanticVersion,
								text: description
							});
						}
						catch (err){
							console.error ('Could not update semantic version. Check '+errorFile+' for more details.');
							error.addError (err);
							process.exit (-1);
						}
					}
					else{
						console.error ('No credentials. Semantic version not changed.');
						process.exit (-1);
					}
					cb (code);
				}
			});
		}
		catch (err){
			console.error ('Docker error. Check '+errorFile+' for more details.');
			error.addError (err.message);
			process.exit (-1);
		}
	}
	else cb(0);
}

async function checkVersion (version, appId){
	try{
		let versions = await appApi.versions (appId);
		if (versions && versions.length > 0){
			let max = Math.max (...versions);
			return version > max;
		}
		return true;
	}
	catch (err){
		console.error ('Could not get container versions.');
		console.error ('Check '+ errorFile + ' for more details.');
		process. exit (-1);
	}
}

function searchSettings (myPath){
	let files = fs.readdirSync (myPath);
	if (files.indexOf(projectSettingsFile) != -1)
		return fs.readFileSync (path.join (myPath, projectSettingsFile), 'utf8');
	else if (myPath === path.join (myPath, '..'))
		return null;
	else
		return searchSettings (path.join (myPath, '..'));
}

async function getProjectSettings (sourceFolder){
	try{
		let projectSettings;
		let tempProjectSettings = searchSettings (sourceFolder);
		tempProjectSettings = JSON.parse (tempProjectSettings);
		if (tempProjectSettings.id){
			if (projectApi){
				try{
					projectSettings = await projectApi.get (tempProjectSettings.id);
				}
				catch (err){
					console.error ('Could not get project settings.');
					error. add (err);
				}
				if (!projectSettings){
					projectSettings = tempProjectSettings;
				}
			}
		}
		else{
			projectSettings = tempProjectSettings;
		}
		return projectSettings;
	}
	catch (e){
		console.error (e.message);
		console.error ('Could not parse project settings file.');
		console.error ('Run wylio project init.');
		process.exit (-1);
	}
}

async function getOnlineProjectSettings (projectId){
	if (projectApi){
		try{
			let onlineProject = await projectApi.get (projectId);
			if (onlineProject){
				return {
					name: onlineProject.name,
					appId: onlineProject.appId,
					language: onlineProject.language,
					id: onlineProject.projectId,
					platform: onlineProject.platform,
					ui: onlineProject.ui
				};
			}
			else{
				console.error ('No project found.');
				process.exit (-1);
			}
		}
		catch (err){
			console.error ('Cannot get project. Check '+errorFile+' for more details.');
			error.add (err.stack);
			process.exit (-1);
		}
	}
	else{
		console.error ('No session. Cannot get project.');
		process.exit (-1);
	}
}

async function nextContainerVersion(appId){
	if (appApi){
		try{
			let versions = await appApi.versions (appId);
			if (versions)
				return Math.max (...versions) + 1;
			return 1;
		}
		catch (err){
			console.error ('Cannot get project versions. Check '+errorFile+' for more details.');
			error.add (err.stack);
		}
	}
	else{
		console.error ('No session. Cannot retrieve application version. Please log in or select a profile.');
		process.exit (-1);
	}
}

exports.edit = async function  (argv){
	nonce.check (argv.nonce);
	nonce.add (argv.nonce);
	let projectSettings = await getProjectSettings(process.cwd());
	if (argv.name){
		projectSettings.name = argv.name;
	}
	if (argv.platform){
		projectSettings.platform = argv.platform;
	}
	if (argv.appId){
		projectSettings.appId = argv.appId;
	}
	if (argv.id){
		projectSettings.id = argv.id;
	}
	if (argv.ui){
		projectSettings.ui = argv.ui;
	}
	try{
		fs.writeFileSync (path.join(process.cwd(), projectSettingsFile), JSON.stringify(projectSettings));
		console.log ('Project updated successfully.');
	}
	catch (err){
		console.error ('Filesystem error. Check '+errorFile+' for more details.');
		error.add (err.stack);
		process.exit (-1);
	}
};


exports.build = async function (argv){
	nonce.check (argv.nonce);
	nonce.add (argv.nonce);
	let profile = profileService.getCurrentProfile().profile;
	let version = argv.application_version;
	let projectSettings;
	if (process.env.WYLIODRIN_PROJECT_ID){
		console.log ('Using environment configurations');
		projectSettings = await getOnlineProjectSettings (process.env.WYLIODRIN_PROJECT_ID);
	}
	else{
		projectSettings = await getProjectSettings(process.cwd());
	}

	if (!version){
		version = 'dev';
	}
	else if (projectSettings.appId.substring (0, 5) !== 'local'){
		if (!await checkVersion (version, projectSettings.appId)){
			console.log ('The provided version is less or equal to the latest published version.');
			console.log ('The Docker image will be created but it cannot be published.');
		}
	}

	if (settingsApi){
		try{
			let settings = await settingsApi.get ();
			if (settings){
				build (projectSettings, settings, version, undefined, undefined, async (code)=>{
					process.exit (code);
				});
			}
			else{
				console.error ('No settings. Cannot generate docker image');
				await pressKey.wait(argv, -1);
				process.exit (-1);
			}
		}
		catch (err){
			console.error ('Could not get account settings. Check '+errorFile+' for more details.');
			err.add (err.stack);
			await pressKey.wait(argv, -1);
			process.exit (-1);
		}
	}
	else{
		console.error ('No session. Could not get account settings.');
		process.exit (-1);
	}
};

exports.publish = async function (argv){
	nonce.check (argv.nonce);
	nonce.add (argv.nonce);
	let profile = profileService.getCurrentProfile().profile;
	let version = argv.application_version;
	let description = (argv.description)? argv.description: '';
	let semanticVersion = argv['project-version'];
	let projectSettings;
	if (process.env.WYLIODRIN_PROJECT_ID){
		console.log ('Using environment configurations');
		projectSettings = await getOnlineProjectSettings (process.env.WYLIODRIN_PROJECT_ID);
	}
	else{
		projectSettings = await getProjectSettings(process.cwd());
	}

	if (version){
		if (!await checkVersion (version, projectSettings.appId)){
			console.error ('The provided version is less or equal to the latest published version.');
			console.error ('Cannot publish docker image.');
			process.exit (-1);
		}
	}
	else
		versions = await nextContainerVersion(projectSettings.appId);
	
	if (settingsApi){
		try{
			let settings = await settingsApi.get ();
			if (settings){
				let appId = projectSettings.appId;
				if (appId.substring (0, 5) === 'local'){
					console.error ('This project has no application assigned.');
					process.exit (-1);
				}
				try{
					let app = await appApi.get (appId);
					if (!app){
						console.error ('Please provide an existing application id.');
						process.exit (-1);
					}
					build (projectSettings, settings, version, undefined, undefined, (code)=>{
						if (code === 0){
							publish (settings, projectSettings, version, semanticVersion, description, (code)=>{
								cb (code);
							});
						}
					});
				}
				catch (err){
					console.error ('Could not publish application. Check '+errorFile+' for more details.');
					error.addError (err.stack);
					process.exit (-1);
				}
			}
			else{
				console.error ('Could not get general settings.');
				process.exit (-1);
			}
		}
		catch (err){
			console.error ('Could not get general settings. Check '+errorFile+' for more details.');
			error.addError (err.stack);
			process.exit (-1);
		}
	}
	else{
		console.error ('Could not get general settings.');
		console.error ('No session. Log in or change profile.');
		process.exit (-1);
	}   
};

exports.run = async function (argv){
	nonce.check (argv.nonce);
	nonce.add (argv.nonce);
	let profile;
	if (process.env.WYLIODRIN_STUDIO_THEIA && process.env.USER){
		profile = process.env.USER;
	}
	else{
		profile = profileService.getCurrentProfile().profile;
	}
	let productId = argv.product_id;
	let app;
	if (productApi){
		try{
			let product = await productApi.get (productId);
			if (product){
				if (product.type === 'development'){
					if (product.status === 'offline'){
						console.error ('Device might be offline.');
					}
					let projectSettings;
					if (process.env.WYLIODRIN_PROJECT_ID){
						console.log ('Using environment configurations');
						projectSettings = await getOnlineProjectSettings(process.env.WYLIODRIN_PROJECT_ID);
					}
					else{
						projectSettings = await getProjectSettings(process.cwd());
					}
					try{
						let settings = await settingsApi.get ();
						if (settings){
							if (settings.PLATFORM[projectSettings.platform].docker.platform == 'none'){
								build (projectSettings, settings, undefined, 'dev', argv['session-id'], productId, async (code)=>{
									if (code === 0){
										console.log ('Build successfully');
										await pressKey.wait(argv, code);
										process.exit (code);
									}
									else{
										console.error ('Build failed');
										await pressKey.wait(argv, code);
										process.exit (code);
									}
								});
							}
							else{
								let appId = projectSettings.appId;
								if (appId.substring (0, 5) === 'local'){
									console.error ('No application assigned.');
								}
								try{
									app = await appApi.get (appId);
									if (!app){
										console.error ('Please provide an existing application id.');
										await pressKey.wait(argv, -1);
										process.exit (-1);
									}
									build (projectSettings, settings, appId, 'dev', undefined, undefined, async (code)=>{
										if (code === 0){
											await publish (settings, appId, 'dev', async (code)=>{
												if (code === 0){
													console.log ('Pinging device...');
													let online = false;
													let timer = setTimeout (async function (){
														if (!online){
															console.error ('Ping timeout. Device offline.');
															await pressKey.wait(argv, -1);
															process.exit (-1);
														}
													}, 10000);
													socketService.connect (profile.api, profile.token, ()=>{
														socketService.send ('packet', productId, {
															t: 'r',
															d:{
																a: 'p',
																id: appId
															}
														});
													}, async (data)=>{
														if (data.t === 'r' && data.d.id === appId){
															if (data.d.a === 'e'){
																if (data.d.e === 'norun'){
																	//TODO
																}
															}
															else if (data.d.a === 'k'){
																process.stdout.write (data.d.t);
															}
															else if (data.d.a === 's'){
																await pressKey.wait(argv, 0);
																process.exit (0);
															}
															else if (data.d.a === 'p'){
																online = true;
																clearTimeout(timer);
																socketService.send ('packet', productId, {
																	t: 'r',
																	d: {
																		id: appId,
																		a: 'e',
																		priv: app.privileged,
																		net: app.network,
																		p: app.parameters,
																		c: process.stdout.columns,
																		r: process.stdout.rows,
																		reset: (argv.reset !== 'false')? true: false
																	}
																});
																console.log ('Press Ctrl+q to exit the application.');
																console.log ('Press Ctrl+r to reload application.');
																process.stdin.setRawMode (true);
																process.stdin.setEncoding( 'utf8' );
																readline.emitKeypressEvents(process.stdin);
																process.stdin.on('keypress', async (str, key) => {
																	if (key.ctrl && key.name === 'q'){
																		socketService.send ('packet', productId, {
																			t: 'r',
																			d: {
																				id: appId,
																				a:'s'
																			}
																		});
																		console.log ('');
																		console.log ('Disconnected');
																		await pressKey.wait(argv, 0);
																		process.exit (0);
																	}
																	else if (key.ctrl && key.name === 'r'){
																		let app = await appApi.get (appId);
																		if (app){
																			socketService.send ('packet', productId, {
																				t: 'r',
																				d: {
																					id: appId,
																					a: 'e',
																					priv: app.privileged,
																					net: app.network,
																					p: app.parameters,
																					c: process.stdout.columns,
																					r: process.stdout.rows,
																					reset: (argv.reset !== 'false')? true: false
																				}
																			});
																		}
																		else{
																			console.error ('Application not found.');
																		}
																	}
																	else{
																		socketService.send ('packet', productId, {
																			t: 'r',
																			d: {
																				id: appId,
																				a:'k',
																				t:str
																			}
																		});
																	}
																});
																process.stdout.on('resize', function() {
																	socketService.send ('packet', productId, {
																		t: 'r',
																		d: {
																			id: appId,
																			a: 'r',
																			c: process.stdout.columns,
																			r: process.stdout.rows
																		}
																	});
																}); 
															}
														}
													});
												}
												else{
													await pressKey.wait(argv, code);
													process.exit (code);
												}
											});
										}
										else{
											await pressKey.wait(argv, code);
											process.exit (code);
										}
									});
								}
								catch (err){
									console.error ('Could not get application. Check '+errorFile+' for more details.');
									error.addError (err.stack);
									await pressKey.wait(argv, -1);
									process.exit (-1);
								}
							}
						}
						else{
							console.error ('Could not get account settings.');
							await pressKey.wait(argv, -1);
							process.exit (-1);
						}
					}
					catch (err){
						console.error ('Could not get product. Check '+errorFile+' for more details.');
						error.addError (err.stack);
						await pressKey.wait(argv, -1);
						process.exit (-1);
					}
				}
				else{
					console.log ('The provided product is not in development mode.');
					console.log ('Please provide the id of a product in development mode.');
				}
			}
			else{
				console.log ('Please provide a valid product id.');
			}
		}
		catch (err){
			console.error ('Could not get product. Check '+errorFile+' for more details.');
			error.addError (err.stack);
			await pressKey.wait(argv, -1);
			process.exit (-1);
		}
	}
	else{
		console.error ('No credentials. Please login or select a profile.');
		await pressKey.wait(argv, -1);
		process.exit (-1);
	}
};

exports.list = async function (argv){
	nonce.check (argv.nonce);
	nonce.add (argv.nonce);
	if (projectApi){
		try{
			let projects = await projectApi.list ();
			if (argv.o === 'json')
				console.log (JSON.stringify (projects, null, 3));
			else if (projects && projects.length > 0){
				let format = argv.f;
				if (format === undefined)
					format = tableBuilder.getDefaultProject ();
				else if (format.indexOf ('wide') != -1){
					format = tableBuilder.getWideProject ();
				}
				let header = tableBuilder.header (format, 'project');
				let table = new Table({
					head: header
				});            
				for (let project of projects){
					let values = [];
					for (let f of format){
						if (f === 'appId'){
							if (project.appId)
								values.push (project.appId);
							else
								values.push ('-');
						}
						else{
							values.push (project[f]);
						}
					}
					table.push (values);
				}
				console.log (table.toString());
			}
			else
				console.log ('No projects to display.');
		}
		catch (err){
			console.error ('Could not get project. Check '+errorFile+' for more details.');
			error.addError (err.stack);
			process.exit (-1);
		}
	}
	else{
		console.error ('No credentials. Please login or select a profile.');
		process.exit (-1);
	}
};
