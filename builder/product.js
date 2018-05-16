const commands = ['provision', 'list', 'describe', 'delete', 'schedule', 'unschedule', 'edit', 'provisioning-file', 'script', 'logs', 'applications'];
const _ = require ('lodash');
module.exports = function (yargs, handler){
    yargs.command(['product','p'], 'Product settings.', 
     (yargs) => {
        yargs.command (['provision', 'p'],  'Provision the device.', {
            type: {
                alias: 't',
                type: 'string',
                choices: ['production', 'beta', 'development'],
                demandOption: true
            },
            'cluster-id': {
                alias: 'cluster',
                desc: 'The id of the cluster that the product is part of.',
                demandOption: true,
                type: 'string'
            },
            shell: {
                alias: 's',
                desc: 'Specifies if the product allows a shell connection to it.',
                demandOption: true,
                type: 'boolean'
            },
            name: {
                alias: 'n',
                type: 'string',
                desc: 'The name of the product.',
                demandOption: true
            },
            platform: {
                alias: 'p',
                type: 'string',
                demandOption: true,
                choices: ['arm', 'x86']
            },
            'public-key':  {
                alias: 'k-pub',
                desc: 'A PEM formatted public RSA key, used to register products. If not specified, a key pair will be generated by the server for the product.',
                demandOption: false,
                type: 'string'
            },
            'private-key':  {
                alias: 'k-prv',
                desc: 'A PEM formatted private RSA key, used to register products. If not specified, a key pair will be generated by the server for the product.',
                demandOption: false,
                type: 'string'
            },
            serial: {
                desc: 'The product serial number.',
                demandOption: false,
                type: 'string'
            },
            'latitunde': {
                desc: 'lat',
                desc: 'The latitude of the product\'s location.',
                demandOption: false,
                type: 'number'
            },
            'longitude': {
                desc: 'lot',
                desc: 'The longitude of the product\'s location.',
                demandOption: false,
                type: 'number'
            },
            'altitude': {
                desc: 'alt',
                desc: 'The altitude of the product\'s location.',
                demandOption: false,
                type: 'number'
            }
        }, handler.provision)
        .command (['list <cluster_id>', 'l'], 'List all product in cluster.', {
            format: {
                alias: 'f',
                type: 'array',
                desc: 'Specify output format. Wide (contains all fields), or specify each field.',
                choices: ['wide', 'clusterId', 'ownerId', 'serial', 'type', 'shell', 'latestTokenRefresh', 'name', 'token',
                        'registerDate', 'registerType', 'platform', 'latestStatus', 'logNumber', 'errorNumber', 'status',
                        'allow', 'upFrame', 'productId', 'cpu']
            }
        }, handler.list)
        .command ('logs <product_id>', 'Show product logs.', {
            type: {
                alias: 't',
                choices: ['info', 'error', 'possible'],
                type: 'string',
                default: 'info'
            }
        }, handler.logs)
        .command (['describe <product_id>', 'd'], 'Show product information.', {}, handler.get)
        .command (['delete <product_id>', 'del'], 'Deletes the product.', {}, handler.delete)
        .command ('schedule <product_id> <action>', 'Schedule an action for the product.', {}, handler.schedule)
        .command ('unschedule <product_id> <action>', 'Unschedule an action for the product.', {}, handler.schedule)
        .command (['edit <product_id>', 'e'], 'Edit product.', {
            name: {
                alias: 'n',
                type: 'string',
                desc: 'The name of the product.',
            },
            'latitunde': {
                desc: 'lat',
                desc: 'The latitude of the product\'s location',
                type: 'number'
            },
            'longitude': {
                desc: 'lot',
                desc: 'The longitude of the product\'s location',
                type: 'number'
            },
            'altitude': {
                desc: 'alt',
                desc: 'The altitude of the product\'s location',
                type: 'number'
            },
            hardware: {
                alias: 'hw',
                desc: 'A name for the hardware that the product uses',
                type: 'string'
            },
            shell: {
                alias: 's',
                desc: 'Specifies if the product allows a shell connection to it.',
                type: 'boolean'
            },
            'update-cluster': {
                desc: 'Ignore the product update options and use the ones from the cluter that the product belongs to.',
                type: 'boolean',
                default: false
            },
            'update-hours': {
                desc: 'Perform updates only between specified hours. If set to true, need to specify update-from and update-to',
                type: 'boolean',
                default: false
            },
            'update-from': {
                desc: 'Start performing updates from this hour. update-hours needs to be set to true.',
                type: 'number'
            },
            'update-to': {
                desc: 'Start performing updates until this hour. update-hours needs to be set to true.',
                type: 'number'
            },
            'update-interval': {
                desc: 'Perform update requests (and updates if needed) at this hours interval.',
                type: 'number'
           }
        }, handler.edit)
        .command ('applications <product_id>', 'Get product applications.', {}, handler.applications)
        .command ('script', 'Adds or removes a script.', 
        (yarg) => {
            yarg.command ('add', 'adds a new script', {
                name: {
                    alias: 'n',
                    desc: 'Script name',
                    type: 'string',
                    demandOption: true
                },
                command: {
                    alias: 'c',
                    desc: 'Command chain',
                    type: 'string',
                    demandOption: true
                },
                'product-id': {
                    alias: 'product',
                    desc: 'The productId',
                    type: 'string',
                    demandOption: true
                }
            }, handler.addScript)
            .command ('remove', 'Removes the script from the product.', {
                name: {
                    alias: 'n',
                    desc: 'Script name',
                    type: 'string',
                    demandOption: true
                },
    
                'product-id': {
                    alias: 'product',
                    desc: 'The productId',
                    type: 'string',
                    demandOption: true
                }
            }, handler.deleteScript)
            .check ((argv)=>{
                if (argv._[2] === 'add' || argv._[2] === 'remove')
                return true;
            throw new Error ('Invalid command.');
            })
            .help ()
            .demandCommand ();
        })
        .command (['provisioning-file <product-id>', 'pf'], 'Get product\'s provisioning file.' , {}, handler.getJson)
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