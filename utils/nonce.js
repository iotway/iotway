const fs = require ('fs-extra');
exports.check = function (nonce){
    if (nonce){
        try{
            let nonceData = fs.readFileSync ('/tmp/wylio/nonce', 'utf8');
            if (nonceData){
                let nonces = nonceData.split (',');
                if (nonces.indexOf(nonce) >= 0)
                    process.exit (-1);
            }
        }
        catch (e){

        }
    }
};

exports.add = function (nonce){
    if (nonce){
        let nonces = [];
        try{
            let nonceData = fs.readFileSync ('/tmp/wylio/nonce', 'utf8');
            if (nonceData){
                nonces = nonceData.split (';');
            }
        }
        catch (e){
            try{
                fs.mkdirSync ('/tmp/wylio');
            }
            catch (e){}
        }
        finally{
            nonces.push (nonce);
            try{
                fs.writeFileSync ('/tmp/wylio/nonce', nonces.toString ());
            }
            catch (e){
                
            }
        }
    }
}