const _ = require ('lodash');

module.exports = function (http)
{
    return {
        platforms: async function (){
			let response = await http.get ('/settings');
            if (response.data){

				let platforms = response.data.PLATFORM;
				let emulatorPlatforms = [];
				for (let platform in platforms)
				{
					if (platforms[platform].emulator)
					{
						emulatorPlatforms.push (_.assign ({
							platform
						},
						platforms[platform].emulator));
					}
				}
				return emulatorPlatforms;
            }
            return null;
        },
    };
};