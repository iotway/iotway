const _ = require ('lodash');
const commands = ['init', 'run', 'list', 'build', 'publish'];
module.exports = function (yargs, handler){
    yargs.command(['project', 'proj'], 'Project settings.',
     (yargs) => {
        yargs.command ('list', 'List all current user\'s projects.', {}, handler.list)
        .command ('init',  'Creates a new project template.', {
            name: {
                alias: 'n',
                type: 'string',
                desc: 'The name of the project.'
            },
            platform: {
                alias: 'p',
                choices: ['arm', 'x86']
            },
            'app-id':{
                alias: 'app',
                type: 'string',
                desc: 'The id of the application linked to this project.',
                default: 'local.'
            },
            ui: {
                choices: ['noui', 'Xorg', 'electron'],
                default: 'noui'

            },
            language: {
                type: 'string',
                choices: ['javascript', 'js', 'python', 'py']
            }
        }, handler.init)
        .command (['edit', 'e'], 'Edit project.', {
            id: {
                type: 'string',
                desc: 'An existing id of the project.'
            },
            name: {
                alias: 'n',
                type: 'string',
                desc: 'The name of the project.'
            },
            platform: {
                alias: 'p',
                choices: ['arm', 'x86']
            },
            'app-id':{
                alias: 'app',
                type: 'string',
                desc: 'The id of the application linked to this project.',
            },
            ui: {
                choices: ['noui', 'Xorg', 'electron'],
                default: 'noui'

            }
        }, handler.edit)
        .command (['run <product_id>', 'r'], 'Runs the current project', {}, handler.run)
        .command (['build [version]', 'v'], 'Builds a docker image of the current project', {}, handler.build)
        .command (['publish <version>', 'p'], 'Pushes the docker image into the registry.', {}, handler.publish)
        .check ((argv)=>{
            if (_.indexOf (commands, argv._[1]) != -1)
                return true;
            throw new Error ('Invalid command.');
        })
       .help ()
       .demandCommand ();
     });
    return yargs;
};