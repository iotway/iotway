#!/usr/bin/env node
const commands = ['user', 'profile', 'cluster', 'product', 'app', 'deploy', 'shell'];
const _ = require ('lodash');
require('dotenv').config();
let yargs = require ('yargs');


yargs = require ('./builder/user')(yargs, require ('./executer/user'));
yargs = require ('./builder/profile')(yargs, require ('./executer/profile'));
yargs = require ('./builder/cluster')(yargs, require ('./executer/cluster'));
yargs = require ('./builder/product')(yargs, require ('./executer/product'));
yargs = require ('./builder/app')(yargs, require ('./executer/app'));
yargs = require ('./builder/deploy')(yargs, require ('./executer/deploy'));
yargs = require ('./builder/shell')(yargs, require ('./executer/shell'));

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
.argv