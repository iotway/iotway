const readlineSync = require('readline-sync');
let libiotway = require('libiotway');
const child_process = require ('child_process');
const nonce = require('../utils/nonce');
const profileService = require('../utils/profile');
const error = require('../utils/error');

const errorFile = require ('../utils/settings').errorFile;

async function loginUser(host, username, password){
	let res = await libiotway.init(host, username, password);
	return res;
}

module.exports.login = async function (argv) {
	nonce.check(argv.nonce);
	nonce.add(argv.nonce);
	let username = argv.username;
	let password = argv.password;
	let host = argv.host;
	if (username === undefined) {
		username = readlineSync.question('username: ');
	}
	if (password === undefined) {
		password = readlineSync.question('password: ', { hideEchoBack: true });
	}
	if (host === undefined) {
		let currentProfile = profileService.getCurrentProfile().profile;
		if (currentProfile.api)
			host = currentProfile.api;
		else
			host = readlineSync.question('host: ');
	}
	if (host.substring(0, 4) != 'http')
		host = 'https://' + host;
	if (host[host.length - 1] == '/') {
		host = host.substring(0, host.length - 1);

	}
	
	try {
		calls = await loginUser(host,username,password);
		token = libiotway.getToken();

		let profileName = profileService.getCurrentProfileName();
		profileService.storeProfileData(profileName, { username: username, token: token, api: host });
		console.log ('Logged in successfully.');

		console.log ('Running docker login. This might take a while.');
		let settings = await calls.settings.get();
		if (settings){
			child_process.execSync ('docker login ' + settings.REPOSITORY + ' -u ' + username + ' -p ' + token);
			console.log ('Successfully authenticated into docker.');
		}
		else{
			console.error ('Could not get generat settings. Cannot authenticate into docker.');
			process.exit (-1);
		}
	}
	catch (err) {
		console.error('Log in failed');
		error.addError(err);
		process.exit(-1);
	}
};

module.exports.logout = async function (argv) {
	nonce.check(argv.nonce);
	nonce.add(argv.nonce);
	let usersApi = libiotway.get().users;
	if (usersApi) {
		try {
			await usersApi.logout();
			let currentProfile = profileService.getCurrentProfile();
			let currentProfileData = currentProfile.profile;
			if (currentProfileData.token)
				delete currentProfileData.token;
			if (currentProfileData.username)
				delete currentProfileData.username;
			profileService.storeProfileData(currentProfile.name, currentProfileData);

		}
		catch (err) {
			console.error('Session expired. Log in or select different profile.');
			error.addError(err);
			process.exit(-1);
		}

		try{
			child_process.execSync ('docker logout');
		}
		catch (err){}
	}
	else {
		console.error('No credentials. Please login or select a profile.');
		process.exit(-1);
	}
};