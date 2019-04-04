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
const error = require ('../utils/error');
const errorFile = require ('../utils/settings').errorFile;

const appApi = libwyliodrin.apps;
const productApi = libwyliodrin.products;
const settingsApi = libwyliodrin.settings;
const projectApi = libwyliodrin.projects;
const userApi = libwyliodrin.users;

const projectSettingsFile = 'iotway.json';

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

function normalizeProjectName (name){
	//parse project name and delete all illegal characters
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
	let contents = fs.readdirSync (process.cwd());
	if (contents.length === 0 || (contents.length === 1 && contents[0] === 'project.log')){
		let settings;
		if (settingsApi){
			try{
				settings = await settingsApi.get();
			}
			catch (err){
				console.error ('Could not get settings. Check' + errorFile + ' for more details.');
				error.addError (err);
			}
		}
		let project;
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
				projectName = readlineSync.question ('project name: '); 
			
			if (projectName.length === 0)
				process.exit (-1);
			
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
				}
			}
		}
		//Generate project structure
		try{
			downloadTemplate (project.language, process.cwd());
			fs.writeFileSync (path.join(process.cwd(), projectSettingsFile), JSON.stringify(project, null, 3));
		}
		catch (err){
			console.error ('Filesystem error. Check' + errorFile + ' for more details.');
			error.addError (err);
			process.exit (-1);
		}

		//Generate package.json for js projects
		if (project.language === 'nodejs'){
			try{
				let package = fs.readFileSync (path.join(process.cwd(), 'package.json'), 'utf8');
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
					fs.writeFileSync (path.join(process.cwd(), 'package.json'), package);
				}
				catch (err){
					console.error ('Filesystem error. Could not generate package.json file.');
					console.error ('Check '+errorFile+' for more details.');
					error.add (err.stack);
				}
			}
			catch (err){
				console.error ('No package.json template. Did not generate package.json file');
			}
		}

		//Generate dockerfile if necessary
		try{
			let dockerFile = fs.readFileSync (path.join (process.cwd(), 'dockerfile'), 'utf8');
			
			let dockerData = {
				REPOSITORY: settings.REPOSITORY,
				DEPLOYER_DOMAIN: settings.DEPLOYER,
				project: project,
				arm: (settings.PLATFORM[project.platform].docker.platform === 'arm')? true: false
			};
			
			dockerFile = mustache.render (dockerFile, dockerData);
			let buildFolder = path.join(process.cwd(), 'build');
			try{
				fs.writeFileSync (path.join(buildFolder, 'dockerfile'), dockerFile);
			}
			catch (err){
				console.error ('Could not generate dockerfile.');
				console.error ('Filesystem error. Check '+errorFile+' for more details.');
				error.add (err.stack);
				process.exit (-1);
			}
		}
		catch (err){
			console.log ('No docker file generated');
			console.error ('Check '+errorFile+' for more details.');
			error.add (err.stack);
		}
	}
	else{
		console.log ('Folder not empty. Please run command in an empty folder.');
	}
};

function build(projectSettings, settings, appId, version, sessionId, productId, cb){
	//Run make
	console.log ('make');
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
		}
		let buildFolder = path.join (process.cwd(), 'build');
		if (code === 0 && settings.PLATFORM[projectSettings.platform].docker.platform !== 'none'){
			try{
				// Build docker image
				try{
					console.log ('Building docker image.');
					let dockerBuild = child_process.spawn ('docker', ['build', '-t', settings.REPOSITORY+'/'+appId+':'+version, '.'], {cwd: buildFolder});
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
					console.error ('Docker error. Check '+errorFile+' for more details.');
					error.add (err.stack);
					process.exit (-1);
				}
			}
			catch (err){
				console.error ('Build error. Check '+errorFile+' for more details.');
				error.addError (err.stack);
				process.exit (-1);
			}
		}
		else{
			cb (code);
		}
	});
}

function publish (profile, settings, projectSettings, version, semanticVersion, description, cb){
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
						error.add (err);
						process.exit (-1);
					}
				}
				else{
					console.error ('No credentials. Semantic version not changed.');
					process.exit (-1);
				}
				cb (code);
			});
		}
		catch (err){
			console.error ('Docker error. Check '+errorFile+' for more details.');
			error.add (err.message);
			process.exit (-1);
		}
	}
	else cb(0);
}

function publishDev (profile, settings, appId, version, cb){
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
		dockerPush.on ('exit', (code)=>{
			cb (code);
		});
	}
	catch (err){
		console.error ('Docker error. Check '+errorFile+' for more details.');
		error.add (err.message);
		process.exit (-1);
	}
}

function dockerLogin (settings, profile, cb){
	try{
		let dockerLogin = child_process.spawn ('docker', ['login', settings.REPOSITORY, '-u', profile.username, '-p', profile.token]);
		dockerLogin.stdout.on ('data', (data)=>{
			print (data, 'DOCKER LOGIN', process.stdout);
		});
		dockerLogin.stderr.on ('data', (data)=>{
			print (data, 'DOCKER LOGIN', process.stderr);
		});
		dockerLogin.on ('exit', (code)=>{
			cb (code);
		});
	}
	catch (err){
		console.error ('Docker error. Check '+errorFile+' for more details.');
		error.add (err.message);
		process.exit (-1);
	}
}

function checkVersion (version, versions){
	if (versions && versions.length > 0){
		let max = Math.max (...versions);
		return version > max;
	}
	return true;
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

async function containerVersion(appId){
	if (appApi){
		try{
			let versions = await appApi.versions (appId);
			return Math.max (...versions) + 1;
		}
		catch (err){
			console.error ('Cannot get project versions. Check '+errorFile+' for more details.');
			error.add (err.stack);
		}
	}
	else{
		console.error ('No session. The Docker image will be created but it cannot be published.');
	}
	console.log ('Version set to default value 1');
	return 1;
}

function downloadTemplate(language, projectFolder){
	let repo = ''+language;
	try{
		child_process.spawnSync('git clone '+repo+' ' + projectFolder +' && rm -rf '+projectFolder+'/.git');
	}
	catch (err){
		console.error ('Cannot generate project template. Make sure git is intalled.');
		console.error('Check '+errorFile+' for more details.');
		error.add (err.stack);
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
		let versions = await containerVersion(projectSettings.appId);
		if (!await checkVersion (version, versions)){
			console.log ('The provided version is less or equal to the latest published version.');
			console.log ('The Docker image will be created but it cannot be published.');
		}
	}
	if (settingsApi){
		try{
			let settings = await settingsApi.get ();
			if (settings){
				if (settings.PLATFORM[projectSettings.platform].docker.platform === 'none'){
					build (projectSettings, settings, projectSettings.appId, version, undefined, undefined, (code)=>{
						//Docker logout
						child_process.spawn ('docker', ['logout', settings.REPOSITORY]);
						process.exit (code);
					});
				}
				else{
					//Run docker login
					dockerLogin (settings, profile, (code)=>{
						if (code === 0){
							build (projectSettings, settings, projectSettings.appId, version, undefined, undefined, (code)=>{
								//Docker logout
								child_process.spawn ('docker', ['logout', settings.REPOSITORY]);
								process.exit (code);
							});
						}
						else{
							process.exit (code);
						}
					});
				}
			}
			else{
				console.error ('No settings. Cannot generate docker image');
				process.exit (-1);
			}
		}
		catch (err){
			console.error ('Could not get account settings. Check '+errorFile+' for more details.');
			err.add (err.stack);
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
	let versions = await containerVersion(projectSettings.appId);
	if (!await checkVersion (version, versions)){
		console.error ('The provided version is less or equal to the latest published version.');
		console.error ('Cannot publish docker image.');
		process.exit (-1);
	}
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
					dockerLogin (settings, profile, (code)=>{
						if (code === 0){
							build (projectSettings, settings, projectSettings.appId, version, undefined, undefined, ()=>{
								publish (profile, settings, projectSettings, version, semanticVersion, description, (code)=>{
									//Docker logout
									child_process.spawn ('docker', ['logout', settings.REPOSITORY]);
									process.exit (code);
								});
							});
						}
						else{
							process.exit (code);
						}
					});
				}
				catch (err){
					console.error ('Could not get application. Check '+errorFile+' for more details.');
					error.add (err.stack);
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
			error.add (err.stack);
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
								build (projectSettings, settings, undefined, 'dev', argv['session-id'], productId, (code)=>{
									if (code === 0){
										console.log ('Build successfully');
										process.exit (code);
									}
									else{
										console.error ('Build failed');
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
										process.exit (-1);
									}
									dockerLogin (settings, profile, (code)=>{
										if (code === 0){
											build (projectSettings, settings, appId, 'dev', undefined, undefined, async (code)=>{
												if (code === 0){
													await publishDev (profile, settings, appId, 'dev', (code)=>{
														if (code === 0){
															console.log ('Pinging device...');
															let online = false;
															let timer = setTimeout (function (){
																if (!online){
																	console.error ('Ping timeout. Device offline.');
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
															}, (data)=>{
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
															process.exit (code);
														}
													});
												}
												else{
													process.exit (code);
												}
											});
										}
										else{
											process.exit (code);
										}
									});
								}
								catch (err){
									console.error ('Could not get application. Check '+errorFile+' for more details.');
									error.add (err.stack);
									process.exit (-1);
								}
							}
						}
						else{
							console.error ('Could not get account settings.');
							process.exit (-1);
						}
					}
					catch (err){
						console.error ('Could not get product. Check '+errorFile+' for more details.');
						error.add (err.stack);
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
			error.add (err.stack);
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
			error.add (err.stack);
			process.exit (-1);
		}
	}
	else{
		console.error ('No credentials. Please login or select a profile.');
		process.exit (-1);
	}
};
