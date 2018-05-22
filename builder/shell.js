module.exports = function (yargs, handler){
    yargs.command('shell start <product_id>', 'Open a shell connection to the device.', {}, handler.shell)
        .help ()
        .demandCommand ();
    return yargs;
};