const profileService = require ('../service/profile');
let profile = profileService.getCurrentProfile ().profile;
let api; 

if (profile.api)
    api = require ('./api-calls/calls')(profile.api);
if (profile.token)
    api.users.setToken (profile.token);


if (api){
    api.init = function (host){
        api = require ('./api-calls/calls')(host);
        return api;
    }
    module.exports = api;
}
else
    module.exports = {
        init: function (host){
            api = require ('./api-calls/calls')(host);
            return api;
        }
    };