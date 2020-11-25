var pk = {};
var config = {};

module.exports = {
	pk: pk,
	init: init,
	start_server: start_server,
	corsOptions: corsOptions,
	createParameterString: createParameterString,
	jsonHttpData: jsonHttpData,
}

function init(){
	pk.express = require('express');
	pk.app = pk.express();
	pk.path = require('path');
	pk.app = pk.express();

	// configurations
	const cookieParser = require('cookie-parser');
	const bodyParser = require('body-parser');
	const exphbs = require('express-handlebars');

	pk.app.engine('handlebars', exphbs({defaultLayout: 'main'}));
	pk.app.set('view engine', 'handlebars');
	pk.app.set('views', pk.path.join(__dirname, 'views'));
	// Body Parser Middleware
	pk.app.use(bodyParser.json({limit: "1mb"}));
	pk.app.use(bodyParser.urlencoded({limit: "10mb", extended: false }));
	pk.app.use(cookieParser());

	pk.app.use(pk.express.static(pk.path.join(process.cwd(), 'web')));

	pk.fs = require('fs');
	pk.https = require('https');
	pk.http = require('http');
	pk.url_module = require('url');
	pk.querystring = require('querystring');
	pk.cors = require('cors');
	pk.base64url = require('base64url');
	pk.request = require('request');
	pk.util = require('./util_functions');
	pk.util.init(pk);
	pk.util.config = config;
}

function start_server(process_config){
	for (var key in process_config){
		config[key] = process_config[key];
	}

	var httpsCertificatePath = pk.path.join(process.cwd(), config.httpsCertificateRelativePath);
	delete config.httpsCertificateRelativePath;

	var credentials = {
	  key: pk.fs.readFileSync(httpsCertificatePath + '.key'),
	  cert: pk.fs.readFileSync(httpsCertificatePath + '.cer')
	};

	var httpsServer = pk.https.createServer(credentials, pk.app);

	httpsServer.on('error', (e) => {
	  if (e.code === 'EADDRINUSE') {
		console.log('Address in use, retrying...');
		setTimeout(() => {
		  httpsServer.close();
		  httpsServer.listen(PORT, HOST);
		}, 1000);
	  }
	  else {
		console.log('Server listener error: ' + e.code);
		console.log('Details', e);		  	
	  }
	});

	httpsServer.listen(config.httpsServerPort, function(){
		console.log('Https server for ' + config.httpsServerUrl 
			+ ' started on port ' + config.httpsServerPort);
	});	

	config.httpsServerUrlHref = config.httpsServerUrl + ':' + config.httpsServerPort + '/';
}


// these functions are copied from util_functions

function corsOptions(){
	var corsOptions = { 
		origin: function (origin, callback) {
			var whitelist = [];
    		if (whitelist.indexOf(origin) === -1) {
      			callback(null, true)
    		} 
    		else {
      			callback(new Error('Not allowed by CORS'))
    		}
  		}
	}

	return pk.cors(corsOptions);
}

function createParameterString(obj, encode){
	var handleEncode;
	if (encode === false){
		handleEncode = function(input){
			return input;
		}
	}
	else{
		handleEncode = encodeURIComponent;		
	}

	var result = '';
	var separator = '?';
	for (var key in obj){
		var value = obj[key] ? handleEncode(obj[key]) : '';
		result += separator + handleEncode(key) + '=' + value;
		separator = '&';
	}

	return result;
}

async function jsonHttpData(options){
	return new Promise((resolve, reject) => {
		if (typeof window === 'undefined'){
			// url
			var rOptions = {
				url: options.url
			};
			// method
			var method = options.method;
			if (method === undefined){
				method = 'GET';
			}
			rOptions.method = method.toUpperCase();
			// headers
			if (options.headers !== undefined){
				var headers = {};
				for (var i=0; i < options.headers.length; i++){
					var header = options.headers[i];
					headers[header.name] = header.value;
				}
				rOptions.headers = headers;
			}

			var postData = options.postData;
			if (postData){
				if (typeof postData !== 'string'){
					postData = JSON.stringify(postData);
				}
				rOptions.body = postData;
			}

			var request = pk.request;
			request(rOptions, function (error, response, body) {
				if (error || !body){
					reject(error);
					return;
				}
				resolve(body);
			});
		}
		else{
			var xhr = new XMLHttpRequest();
			var method = options.method;
			if (method === undefined){
				method = 'GET';
			}
			xhr.open(method, options.url, true);

			var authorizationHeaderPresent = false;
			if (options.headers !== undefined){
				for (var i=0; i < options.headers.length; i++){
					var header = options.headers[i];
					if (header.name === 'Authorization'){
						authorizationHeaderPresent = true;
					}
					xhr.setRequestHeader(header.name, header.value);
				}
			}

			xhr.onreadystatechange = function () {
			    if (xhr.readyState === 4){
			    	if (xhr.status === 200) {
				        resolve(xhr.responseText);
				    }
				    else {
					    reject(xhr.responseText);
				    }
			    }
			};

			if (authorizationHeaderPresent){
				xhr.withCredentials = true;
			}

			if (method.toUpperCase() === 'GET' || options.postData === undefined){
				xhr.send();
			}
			else{
				var postData = options.postData;
				if (typeof postData !== 'string'){
					postData = JSON.stringify(postData);
				}
				xhr.send(postData);		 			
			}
		}
	});
}

