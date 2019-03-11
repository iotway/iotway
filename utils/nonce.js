const fs = require ('fs-extra');
const settings = require ('./settings');

exports.check = function (nonce){
	if (nonce){
		try{
			let nonceData = fs.readFileSync ('/tmp/iotway/nonce', 'utf8');
			if (nonceData){
				let nonces = nonceData.split (';');
				if (nonces.indexOf(nonce) >= 0){
					console.log (settings.executor+' terminated');
					if (process.env.WYLIODRIN_STUDIO_THEIA){
						console.log ('Please close this terminal.');
					}
					process.exit (-1);
				}
			}
		}
		catch (err){
			console.log(err);
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
		catch (err){
			fs.mkdirSync ('/tmp/wylio');
		}
		finally{
			nonces.push (nonce);
			fs.writeFileSync ('/tmp/wylio/nonce', nonces.toString ());
		}
	}
};