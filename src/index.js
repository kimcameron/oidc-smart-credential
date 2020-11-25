var node_scaffold = require('./node_scaffold');
var cookie = require('cookie');

// initialize the server using config from startup directory]
node_scaffold.init();
var pk = node_scaffold.pk;
var config = require(pk.path.join(process.cwd(), 'config'));
var credentials;
const cookieConfig = {
  secure: true, // to force https (if you use it)
  maxAge: 1000000 // ttl in seconds (remove this option and cookie will die when browser is closed)
};

startup()

function startup(){
	node_scaffold.start_server(config);

	// create the credentials object
	credentials = loadCredentials();

	// listen on the well-known uri
	var endpoint = '/:credential_name/.well-known/verifiable-credential';
	pk.app.options(endpoint, pk.cors());
	pk.app.get(endpoint, pk.util.corsOptions(), function(req, res){
		var credential_name = req.params.credential_name;
		pk.util.log_debug('WELL-KNOWN:  MetadataRequest: ' + credential_name + '\r\n');
		res.set ({
			'Cache-Control': 'no-store',
			'Pragma': 'no-cache',
			'Content-Type': 'application/json',
			'Access-Control-Allow-Origin': '*'
		});

		res.json(metadata(req, res, credential_name));        	
	});

	var endpoint = '/:credential_name/register';
	pk.app.options(endpoint, pk.cors());
	pk.app.get(endpoint, pk.util.corsOptions(), function(req, res){
		var credential_name = req.params.credential_name;
		pk.util.log_debug('REGISTER REQUEST: ' + credential_name + '\r\n');
		processRegister(req, res, credential_name);
	});

	var endpoint = '/:credential_name/validate';
	pk.app.options(endpoint, pk.cors());
	pk.app.get(endpoint, pk.util.corsOptions(), function(req, res){
		var credential_name = req.params.credential_name;
		pk.util.log_debug('VALIDATE REQUEST: ' + credential_name + '\r\n');
		processValidate(req, res, credential_name);
	});

	var endpoint = '/:credential_name/wallet';
	pk.app.options(endpoint, pk.cors());
	pk.app.get(endpoint, pk.util.corsOptions(), function(req, res){
		var credential_name = req.params.credential_name;
		pk.util.log_debug('WALLET REQUEST: ' + credential_name + '\r\n');
		processWallet(req, res, credential_name);
	});
}

function metadata(req, res, credential_name){
	if (!valid_credential_name(res, credential_name)){
		return;
	}

	var host = pk.util.config.httpsServerUrlHref + credential_name + '/' ;
	var metadata = {
		registration_endpoint: host + 'register',
		validation_endpoint: host + 'validate',
		wallet_endpoint: host + 'wallet'
	}

	return metadata;
}

function processRegister(req, res, credential_name){
	if (!valid_credential_name(res, credential_name)){
		return;
	}

	var status = 400;
	var errorMsg = "Undefined Error";
	try{
		var wallet_url = req.query.wallet;
		if (!wallet_url){
			throw ('Missing wallet query parameter.')
		}
		
		res.setHeader('Set-Cookie', cookie.serialize('wallet', String(wallet_url), {
			maxAge: 60 * 60 * 24 * 7, // 1 week
			secure: true,
			path: '/' + credential_name
		}));

		var redirect_url = req.query.redirect;
		if (redirect_url){
		    res.redirect(redirect_url);	
		}
		else{
			var message = {
				status: "OK"
			}
		    res.status= 200;
			res.json(message);
		    res.end();	
		}
	}
	catch(err){
		var message = {
			error: err
		}
		res.status = status;
		res.json(message);
		res.end();
	}
}

function processValidate(req, res, credential_name){
	if (!valid_credential_name(res, credential_name)){
		return;
	}

    res.status = 200;
	var message = {
		status: 'OK'
	}
	res.json(message);
    res.end();	
}

function processWallet(req, res, credential_name){
	if (!valid_credential_name(res, credential_name)){
		return;
	}

	res.render('get_wallet', {
		credential_name: credential_name
	});
}

function loadCredentials(){
	var credentials = {};
	try{
		var credentialsDirName = pk.path.join(__dirname, '../credentials');
		var dirents = pk.fs.readdirSync(credentialsDirName, {withFileTypes: true});
		for (var i=0; i<dirents.length; i++){
			var dirent = dirents[i];
			if (dirent.isFile()){
				var srcPath = pk.path.join(credentialsDirName, dirent.name);
				var credString = pk.fs.readFileSync(srcPath, {encoding: 'utf8'});
				var cred = JSON.parse(credString);
				var direntNoType = dirent.name.substr(0, dirent.name.indexOf('.'));
				if (cred.id !== direntNoType){
					throw ('credential filename differs from credential id: ' + dirent.name);
				}
				credentials[cred.id] = cred;
			} 
		}

		return credentials;
	}
	catch(err){
		pk.util.log_error('loadCredentials', err);
	}
}

function valid_credential_name(res, credential_name){
	if (!credentials[credential_name]){
		res.status = 400;
		var message = {
			error: 'Invalid credential name: ' + credential_name
		}
		res.json(message);
		res.end();
		return false;
	}

	return true;
}