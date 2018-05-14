module.exports = function (endpoint){
    endpoint = endpoint + '/api/v1';
    const httpService = require ('./http')(endpoint);
    const users = require ('./users')(httpService.http, httpService.setToken);
    const clusters = require ('./clusters')(httpService.http);
    const products = require ('./products')(httpService.http);
    const apps = require ('./applications')(httpService.http);
    const deploy = require ('./deploy')(httpService.http);
    const settings = require ('./settings')(httpService.http);
    
    return {
        users: users,
        clusters: clusters,
        products: products,
        apps: apps,
        deploy: deploy,
        settings: settings
    };
};