module.exports = function (http)
{
    return {
        list: async function (clusterId){
            let response = await http.get ('/product/list/'+clusterId);
            if (response.data && response.data.err === 0){

                return response.data.products;
            }
            return null;
        },

        get: async function (productId){
            let response = await http.get ('/product/get/'+productId);
            if (response.data && response.data.err === 0){
                return response.data.product;
            }
            return null;
        },

        provision: async function (params){
            let response = await http.post ('/product/provision', params);
            if (response.data && response.data.err === 0){
                return true;
            }
            return false;
        },

        delete: async function (productId){
            let response = await http.get ('/product/delete/'+productId);
            if (response.data && response.data.err === 0){
                return true;
            }
            return false;
        },

        schedule: async function (params){
            let response = await http.get ('/product/schedule/'+params.productId+'/'+params.action);
            if (response.data && response.data.err === 0){
                return true;
            }
            return false;
        },

        unschedule: async function (params){
            let response = await http.get ('/product/unschedule/'+params.productId+'/'+params.action);
            if (response.data && response.data.err === 0){
                return true;
            }
            return false;
        },

        edit: async function (params){
            let response = await http.post ('/product/edit/'+params.productId, params);
            if (response.data && response.data.err === 0){
                return true;
            }
            return false;
        },

        getWyliodrinJSON: async function (productId){
            let response = await http.get ('/product/provisioning_file/'+productId);
            if (response.data && response.data.err === 0){
                return response.data.provisioningFile;
            }
            return null;
        }
    };
};