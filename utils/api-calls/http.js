const axios = require ('axios');
const errorService = require ('../error');

module.exports = function (endpoint){
    let token = null;

    const instance = axios.create({
        baseURL: endpoint
      });
    // Add a request interceptor
    instance.interceptors.request.use(function (config) {
        // Do something before request is sent
        if (token)
            config.headers.Authorization = 'Bearer ' + token;
        return config;
    });

    instance.interceptors.response.use((response) => {
        return response;
    }, function (error) {
        if (error.response && error.response.data)
            errorService.addError (error);
        if (error.response && error.response.status === 401)
            errorService.addError ('Unauthenticated');
        return error;
    });

    return {
        http: instance,
        setToken: function (tok){
            token = tok;
        }
    };
}