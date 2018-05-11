const axios = require ('axios');

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
            console.error (error.response.data.err);
        if (error.response && error.response.status === 401)
            console.error ('Please authenticate.');
        return error;
    });

    return {
        http: instance,
        setToken: function (tok){
            token = tok;
        }
    };
}