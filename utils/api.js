const profileService = require ('../service/profile');
let profile = profileService.getCurrentProfile ().profile;
let api; 

if (profile.api)
    api = require ('./api-calls/calls')(profile.api);
if (profile.token)
    api.users.setToken (profile.token);

let noApi = {
    get: function (){
        console.error ('No host. Please select profile or log in.');
    },

    post: function (){
        console.error ('No host. Please select profile or log in.');
    }
};

if (api)
    module.exports = api;
else
    module.exports = {
        users: noApi,
        clusters: noApi,
        products: noApi,
        apps: noApi,
        deploy: noApi,
        init: function (host){
            api = require ('./api-calls/calls')(host);
            return api;
        }
    };