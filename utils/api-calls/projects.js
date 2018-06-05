module.exports = function (http){
    return {
        list: async function (){
            let response = await http.get ('/project/list');
            if (response.data && response.data.err === 0){
                return response.data.projects;
            }
            return null;
        },

        get: async function (projectId){
            let response = await http.get ('/project/'+projectId);
            if (response.data && response.data.err === 0){
                return response.data.project;
            }
            return null;
        }
    }
};