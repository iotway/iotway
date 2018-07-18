module.exports = function (http){
    function search (myPath){
        let files = fs.readdirSync (myPath);
        if (files.indexOf('wylio.json') != -1)
            return fs.readFileSync (path.join (myPath, 'wylio.json'))
        else if (myPath === path.join (myPath, '..'))
            return null;
        else
            search (path.join (myPath, '..'));
    }
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