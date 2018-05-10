exports.select = function (yargs, handler){   
    yargs.command ('select <server_address>', 'select server', {}, handler);
};
