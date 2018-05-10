const commands = ['list', 'versions', 'edit', 'upgrade', 'parameter'];
const _ = require ('lodash');
module.exports = function (yargs, handler){
    yargs.command('deploy', 'Deployment settings', 
     (yargs) => {
        yargs.command ('list', 'Get deployments for application or product' , {
            application: {
                alias: 'app',
                desc: 'The Id of the application to get deployments for.',
                type: 'string'
            },
            product: {
                alias: 'prod',
                desc: 'The Id of the product to get deployments for.',
                type: 'string'
            }
        }, handler.list)
        .command ('edit <deploy_id>', 'Edit deployment', {
            'app-id':{
                alias: 'app',
                desc: 'The id of the application deployed',
                demandOption: true,
                type: 'string'
            },
            privileged: {
                alias: 'p',
                desc: 'Specifies if the application should run in a privileged container. If set to true, it will allow the application to access all the resources of the product',
                default: false,
                type: 'boolean'
            },
            network: {
                alias: 'n',
                choices: ['default', 'host'],
                default: 'default',
                type: 'string'
            }
        }, handler.edit)
        .command ('parameter', 'adds or removes a parameter', 
        (yarg) => {
            yarg.command ('add', 'adds a new parameter', {
                id: {
                    desc: 'Deployment id',
                    type: 'string',
                    demandOption: true
                },
                name: {
                    alias: 'n',
                    desc: 'Parameter name',
                    type: 'string',
                    demandOption: true
                },
                values: {
                    alias: 'v',
                    desc: 'Parameter values',
                    type: 'array',
                    demandOption: true
                },
                'app-id': {
                    alias: 'app',
                    desc: 'The application id',
                    type: 'string',
                    demandOption: true
                }
            }, handler.addParam)
            .command ('remove', 'removes a parameter', {
                id: {
                    desc: 'Deployment id',
                    type: 'string',
                    demandOption: true
                },
                name: {
                    alias: 'n',
                    desc: 'Parameter name',
                    type: 'string',
                    demandOption: true
                },
    
                'app-id': {
                    alias: 'app',
                    desc: 'The application id',
                    type: 'string',
                    demandOption: true
                }
            }, handler.deleteParam)
            .check ((argv)=>{
                if (argv._[2] === 'add' || argv._[2] === 'remove')
                return true;
            throw new Error ('Invalid command.');
            })
            .help ()
            .demandCommand ();
        })
        .command ('upgrade <deploy_id> <app_id>', 'Upgrade deployment for application.', {}, handler.upgrade)
        .command ('versions <platform>', 'Get the deployer versions for arm or x86 platform', {}, handler.versions)
        .check ((argv)=>{
            if (_.indexOf (commands, argv._[1]) != -1)
                return true;
            throw new Error ('Invalid command.');
        })
       .help ()
       .demandCommand ();
     })
    return yargs;
};