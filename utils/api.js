const settings = require ('./settings');
const api = require ('./api-calls/calls')(settings.api);
const profileService = require ('../service/profile');

let token = profileService.getCurrentToken ();

if (token)
    api.users.setToken (token);
module.exports = api;