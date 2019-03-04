#!/usr/bin/env node
const commands = ['user', 'profile', 'cluster', 'product', 'emulator', 'e', 'app', 'deploy', 'shell', 'remote', 'project'];
const _ = require ('lodash');
require('dotenv').config();
require ('./utils/error');
let yargs = require ('yargs');
const libiotway = require ('libiotway');

const profileService = require ('./utils/profile');
let profile = profileService.getCurrentProfile().profile;
if (profile.api){
    libiotway.init(profile.api, profile.token);
}

yargs = require ('./builder/user')(yargs, require ('./executer/user'));
yargs = require ('./builder/profile')(yargs, require ('./executer/profile'));
yargs = require ('./builder/cluster')(yargs, require ('./executer/cluster'));
yargs = require ('./builder/product')(yargs, require ('./executer/product'));
yargs = require ('./builder/app')(yargs, require ('./executer/app'));
yargs = require ('./builder/deploy')(yargs, require ('./executer/deploy'));
// yargs = require ('./builder/emulator')(yargs, require ('./executer/emulator'));
yargs = require ('./builder/shell')(yargs, require ('./executer/shell'));
// yargs = require ('./builder/remote')(yargs, require ('./executer/remote'));
yargs = require ('./builder/project')(yargs, require ('./executer/project'));

yargs.help()
.check ((argv)=>{
  if (_.indexOf (commands, argv._[0]) != -1)
      return true;
  throw new Error ('Invalid command.');
})
.demandCommand()
.option ('output', {
  alias: 'o',
  default: 'human',
  global: true,
  choices: ['human', 'json']
})
.option ('nonce', {
  global: true,
  type: 'string'
})
.argv