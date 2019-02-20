module.exports = function (http)
{
    return {
        get: async function (){
            let response = await http.get ('/settings');
            if (response.data)
                return response.data;
            return null;

        }
    };
};