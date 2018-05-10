module.exports = function (http)
{
    return {
        new: async function (params){
            let response = await http.post ('/cluster/add', params);
            if (response.data && response.data.err === 0){
                return true;
            }
            return false;
        },

        list: async function (){
            let response = await http.get ('/cluster/list');
            if (response.data && response.data.err === 0){

                return response.data.clusters;
            }
            return null;
        },

        get: async function (clusterId){
            let response = await http.get ('/cluster/list/'+clusterId);
            if (response.data && response.data.err === 0){
                return response.data.cluster;
            }
            return null;
        },

        delete: async function (clusterId){
            let response = await http.post ('/cluster/remove/'+clusterId);
            if (response.data && response.data.err === 0){
                return true;
            }
            return false;
        },

        edit: async function (params){
            let response = await http.post ('/cluster/edit/'+params.clusterId, params);
            if (response.data && response.data.err === 0){
                return true
            }
            return false;
        },
        
        getWyliodrinJSON: async function (clusterId){
            let response = await http.get ('/cluster/provisioning_file/'+clusterId);
            if (response.data && response.data.err === 0){
                return response.data.provisioningFile;
            }
            return null;
        },

        addScript: async function (params){
            let response = await http.post ('/cluster/script/add/'+params.clusterId, params);
            if (response.data && response.data.err === 0){
                return true;
            }
            return false;
        },

        delScript: async function (params){
            let response = await http.post ('/cluster/script/del/'+params.clusterId, params);
            if (response.data && response.data.err === 0){
                return true;
            }
            return false;
        }
    };
}