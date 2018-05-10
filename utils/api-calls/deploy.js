module.exports = function (http){
    return {
        list: async function (appId){
            let response = await http.get ('/app/deployments/'+appId);
            if (response.data && response.data.err === 0){
                return response.data.deployments;
            }
            return null;
        },

        deploymentsProduct: async function (productId){
            let response = await http.get ('/app/deployments/product/'+productId);
            if (response.data && response.data.err === 0){
                return response.data.deploymentsProduct;
            }
            return null;
        },

        versions: async function (platform){
            let response = await http.get ('/app/versions/com.wyliodrin.deployer.'+platform);
            if (response.data && response.data.err === 0){
                return response.data.versions;
            }
            return null;
        },

        upgrade: async function (params){
            let response = await http.post ('/app/deploy/upgrade/'+params.deployId, {appId: params.appId});
            if (response.data && response.data.err === 0){
                return true;
            }
            return false;
        },

        edit: async function (params){
            let response = await http.post ('/app/deploy/parameters/'+params.deployId, {
                appId: params.appId,
                privileged: params.privileged,
                network: params.network,
                parameters: params.parameters
            });
            if (response.data && response.data.err === 0){
                return true;
            }
            return false;
        }   
    };
}