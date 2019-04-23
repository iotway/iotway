exports.wait = function (argv, code) {
    return new Promise(function (resolve, reject) {
        if (argv.presskey !== undefined) {
            try {

                console.log('Press any key to exit');

                process.stdin.setRawMode(true);
                process.stdin.resume();
                process.stdin.on('data', () => {
                    process.exit.bind(process, code);
                    resolve();
                })
            }
            catch (err) {
            console.log(err);
            reject(err);
        }
    }
    })

};
