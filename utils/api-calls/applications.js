module.exports = function (http)
{
    return {
        list: async function (){
            let response = await http.get ('/app/list/');
            if (response.data && response.data.err === 0){

                return response.data.applications;
            }
            return null;
        },

        versions: async function (appId){
            let response = await http.get ('/app/versions/'+appId);
            if (response.data && response.data.err === 0){
                return response.data.versions;
            }
            return null;
        },

        new: async function (params){
            let response = await http.post ('/app/create', params);
            if (response.data && response.data.err === 0){
                return true;
            }
            return false;
        },

        get: async function (appId){
            let response = await http.get ('/app/list/'+appId);
            if (response.data && response.data.err === 0){
                return response.data.application;
            }
            return null;
        },

        deploy: async function (params){
            let response = await http.post ('/app/deploy/'+params.appId, params);
            if (response.data && response.data.err === 0){
                return true;
            }
            return false;
        },

        undeploy: async function (params){
            let response = await http.post ('/app/undeploy/'+params.deployId, {
                appId: params.appId,
                type: params.type,
                clusterId: params.clusterId,
                productId: params.productId
            });
            if (response.data && response.data.err === 0){
                return true;
            }
            return false;
        },

        edit: async function (params){
            let response = await http.post ('/app/edit/'+params.appId, params);
            if (response.data && response.data.err === 0){
                return true;
            }
            return false;
        },

        delete: async function (appId){
            let response = await http.post ('/app/remove/'+appId);
            if (response.data && response.data.err === 0){
                return true;
            }
            return false;
        },

        addParam: async function (params){
            let response = await http.post ('/app/param/add/'+params.appId, params);
            if (response.data && response.data.err === 0){
                return true;
            }
            return false;
        },

        delParam: async function (params){
            let response = await http.post ('/app/param/del/'+params.appId, params);
            if (response.data && response.data.err === 0){
                return true;
            }
            return false;
        }
    };
}