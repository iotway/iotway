const readlineSync = require('readline-sync');
let libiotway = require ('libiotway');

const nonce = require ('../utils/nonce');
const profileService = require ('../utils/profile');
const error = require ('../utils/error');

module.exports.login = async function (argv){
	nonce.check (argv.nonce);
	nonce.add (argv.nonce);
	let username = argv.username;
	let password = argv.password;
	let host = argv.host;
	if (username === undefined){
		username = readlineSync.question ('username: ');
	}
	if (password === undefined){
		password = readlineSync.question ('password: ',{hideEchoBack:true});
	}
	if (host === undefined){
		let currentProfile = profileService.getCurrentProfile().profile;
		if (currentProfile.api)
			host = currentProfile.api;
		else
			host = readlineSync.question ('host: ');
	}
	if (host.substring (0, 4) != 'http')
		host = 'https://'+host;
	if (host[host.length-1] == '/'){
		console.log('tai din el ultimul caracter: ' + host[host.length-1]);
		host = host.substring(0, host.length-1);
		
	}

	let usersApi = libiotway.init(host).users;

	try{
		let token = await usersApi.login ({
			username: username,
			password: password,
			host: host
		});
		let profileName = profileService.getCurrentProfileName();
		profileService.storeProfileData (profileName, {username: username, token: token, api: host});
	}
	catch (err){
		console.error ('Log in failed');
		error.addError (err);
		process.exit (-1);
	}
};

module.exports.logout = async function (argv){
	nonce.check (argv.nonce);
	nonce.add (argv.nonce);
	let usersApi = libiotway.get().users;
	if (usersApi){
		try{
			await usersApi.logout();
			let currentProfile = profileService.getCurrentProfile();
			let currentProfileData = currentProfile.profile;
			if (currentProfileData.token)
				delete currentProfileData.token;
			if (currentProfileData.username)
				delete currentProfileData.username;
			profileService.storeProfileData (currentProfile.name, currentProfileData);
		}
		catch (err){
			console.error ('Session expired. Log in or select different profile.');
			error.addError (err);
			process.exit (-1);
		}
	}
	else{
		console.error ('No credentials. Please login or select a profile.');
		process.exit (-1);
	}
};