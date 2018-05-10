module.exports = function (http, setToken)
{
    return {
        logout: async function (){
            let response = await http.get ('/user/logout');
            if (response.data && response.data.err === 0){
                return true;
            }
            else{
                return false;
            }
        },

        login: async function (params){
            let response = await http.post ('/user/login', params);
            if (response.data && response.data.token){
                return response.data.token;
            }
            return null;
        },

        setToken: function (token){
            setToken (token);
        }
    };
}