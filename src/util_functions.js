module.exports = {
	"init": init,
	"check": check
};

const { v4: uuidv4 } = require('uuid');

var util_functions = {
	"backSlash": backSlash,
	"binaryHttpData": binaryHttpData,
	"calculateDidUrl": calculateDidUrl,
	"corsOptions": corsOptions,
	"createParameterString": createParameterString,
	"decodeQueryParams": decodeQueryParams,
	"forwardSlash": forwardSlash,
	"get_oidc_config": get_oidc_config,
	"jsonHttpData": jsonHttpData,
	"isUnixFilesystem": isUnixFilesystem,
	"log_always": log_always,
	"log_debug": log_debug,
	"log_detail": log_detail,
	"log_error": log_error,
	"log_protocol": log_protocol,
	"merge_claim_maps": merge_claim_maps,
	"randomToURN": randomToURN,
	"setElementVisibility": setElementVisibility,
	"usingNode": usingNode,
	"url": url,
	"mkDirectoriesInPath": mkDirectoriesInPath,
	"copyDirectory": copyDirectory
};

var pk;

function init(global_pk){
	pk = global_pk;
	if (!pk.util){
		pk.util = {};
	}
	for (var key in util_functions){
		pk.util[key] = util_functions[key];
	}
}

function check(){
/*
pk.url_module
pk.app
pk.uti.config
pk.base64url
*/
}

function url(uri){
	var stdUrl = new pk.url_module.parse(uri);
	var urlWithPort = {
		href: stdUrl.href,
		protocol: stdUrl.protocol,
		host: stdUrl.host,
		hostname: stdUrl.hostname,
		pathname: stdUrl.pathname,
		search: stdUrl.search,
		port: stdUrl.port
	}

	if (!stdUrl.port){
		if (stdUrl.protocol === "http:"){
			urlWithPort.port = 80;
		}
		else if (stdUrl.protocol === "https:"){
			urlWithPort.port = 443;
		}
	}
	else {
		urlWithPort.port = parseInt(stdUrl.port);
	}

	return urlWithPort;
}

function log_always(message){
	console.log(message);
}

function log_detail(arg1, arg2){
	if (pk.util.config.logging > 2){
		var details;
		if (arg2 === undefined){
			details = arg1;
		}
		else{
			console.log(arg1 + ':');
			details = arg2;
		}

		var str = JSON.stringify(details, null, 4);
		console.log(str);
	}
}

function log_debug(message){
	if (pk.util.config.logging > 1){
		console.log(message);
	}
}

function log_error(){
	var copy = [].slice.call(arguments); 
	copy = copy.slice(1);
	console.error('********* ERROR (' + arguments[0] + ') ***********');
	console.error.apply(this, copy);
}

function log_protocol(arg1, arg2){
	if (pk.util.config.logging == 1){
		console.log('*** PROTOCOL (' + arg1 + ') ***');
		console.log(arg2);

		var protocolContent = '';
		if (typeof arg2 === 'string'){
			protocolContent = arg2;
		}
		else if (typeof arg2 === 'object'){
			protocolContent = JSON.stringify(arg2, null, 2);
		}
		else{
			protocolContent = 'ERROR - Protocol Content is neither string nor object';
		}

		if (usingNode()){
			pk.fs.writeFileSync("SIOP/protocol.txt", 
				'*** PROTOCOL (' + arg1 + ') ***\r\n' + protocolContent + '\r\n\r\n',
			    { 
			      encoding: "utf8", 
			      flag: "a+", 
			      mode: 0o666 
			    }); 
		}
	}
}

function calculateDidUrl(did, options){
	var didUrl = did;

	if (didUrl === undefined){
		if (options !== undefined && options.defaultLoginRedirect !== undefined){
			didUrl = options.defaultLoginRedirect;
		}
		else{
			didUrl = httpsServerUrl.protocol + '//' + httpsServerUrl.host + pk.util.WALLET_ENDPOINT + '?';			
		}
	}
	else{
		if (didUrl !== 'web+openid'){
			if (!didUrl.startsWith('https://')){
				if (didUrl.startsWith('http://')){
					didUrl = didUrl.substring(7);
				}
				
				didUrl = 'https://' + didUrl;
			}

			didUrl += pk.util.WALLET_ENDPOINT;			
		}
	}	

	return didUrl;
}

// forwardSlash is pk.util.slash_normalize - adjusts file paths written 
// for windows so they work on unix as well.
function forwardSlash(windows_path){
   if (isUnixFilesystem()){
      windows_path = windows_path.replace(/\\/g, '/');;
   }

   return windows_path;
}

// backSlash is slash_denormalize - adjusts file paths written 
// for unix so they work on windows as well.
function backSlash(unix_path){
   if (!isUnixFilesystem()){
      unix_path = unix_path.replace(/\//g, '\\');;
   }

   return unix_path;
}

// node can run under linux or windows
function usingNode(){
	return (typeof window === "undefined");
}

// unix file system only possible running node
function isUnixFilesystem(){
	// node rather than browser && /usr/bin in the path
	return usingNode() && process.env.PATH.indexOf("/usr/bin") >= 0;
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

function setElementVisibility(id, value) {
	var element = document.getElementById(id);
	if (element){
		if (value === 'toggle'){
			if (element.classList.contains('clms_0')){
				value = true;
			}
			else{
				value = false;
			}
		}
		if (value){
			element.classList.remove('clms_0');
			element.classList.add('clms_1');
		}
		else{
			element.classList.remove('clms_1');
			element.classList.add('clms_0');
		}				
	}
}

function decodeQueryParams(inputString){
	if (inputString.startsWith("?")){
		inputString = inputString.substring(1);
	}
	var params = inputString.split("&");
	var qParams = {};
	for (var i=0; i < params.length; i++){
		var qParam = params[i].split("=");
		qParams[decodeURIComponent(qParam[0])] = decodeURIComponent(qParam[1]);
	}
	return qParams;
}


function get_oidc_config(caller, selector, value){
	if (value === true || value === false){
		match = value === (caller.oidc_config[selector] !== undefined);				
	}
	else {
		// otherwise check for equality
		match = caller.oidc_config[selector] === value;
	}

	if (match){
		caller.oidc_config.config_selected = true;
		return caller.oidc_config;
	}

	return null;
}

// options work as follows
// url: '/tester/configuration',
// method: 'POST',
// headers: [
// 	{ name: 'Content-Type', value: 'application/json'},
//  { name: 'Content-Type', value: 'text/html; charset=utf-8'),
// 	{ name: 'Accept', value: 'application/json'}
// ]

function jsonHttpData(options){
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
					reject(response);
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

function binaryHttpData(options){
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
					thow("post binary not yet implemented");
					// postData = JSON.stringify(postData);
				}
				rOptions.body = postData;
			}

			var request = pk.request;
			request(rOptions, function (error, response, body) {
				if (error || !body){
					reject(response);
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
			if (options.headers !== undefined){
				for (var i=0; i < options.headers.length; i++){
					var header = options.headers[i];
					xhr.setRequestHeader(header.name, header.value);
				}
			}

			xhr.overrideMimeType('text/plain; charset=x-user-defined');

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

			if (method.toUpperCase() === 'GET' || options.postData === undefined){
				xhr.send();
			}
			else{
				var postData = options.postData;
				if (typeof postData !== 'string'){
					throw("post binary not uet implemented");
					// postData = JSON.stringify(postData);
				}
				xhr.send(postData);		 			
			}
		}
	});
}


function randomToURN(base64){
	var uuid;
	if (base64){
		var kidArray = new Uint8Array(Buffer.from(base64, 'base64'));
		var v4Options = { random: kidArray }; 
		uuid = uuidv4(v4Options);
	}
	else{
		uuid = uuidv4();
	}
	
	return 'urn:uuid:' + uuid;
}

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

function merge_claim_maps(mapArray){
	var merged_scope_claim_map = {};

	for (var i=0;i<mapArray.length;i++){
		var map = mapArray[i];		
		if (map){
			for (var key in map){
				merged_scope_claim_map[key] = map[key];
			}			
		}
	}

	return merged_scope_claim_map;
}

function mkDirectoriesInPath(target) {
	var sep;
	var firstSeg = true;
	if (isUnixFilesystem()){
		target = forwardSlash(target);
		sep = '/';
	}
	else{
		target = backSlash(target);
		sep = '\\';
	}
	var segments = target.split(sep);
	var path = '';
	var prefix = '';
	for (var i=0; i < segments.length; i++){
		path += prefix + segments[i];
		prefix = sep;
		if (firstSeg){
			firstSeg = false;
			continue;
		}
		prefix = sep;
		if (!pk.fs.existsSync(path)){
			pk.fs.mkdirSync(path);
		}
	}
}

function copyDirectory(sourceDirName, destDirName){
	mkDirectoriesInPath(destDirName);
	var dirents = pk.fs.readdirSync(sourceDirName, {withFileTypes: true});
	for (var i=0; i<dirents.length; i++){
		var dirent = dirents[i];
		if (dirent.isFile()){
			var name = dirent.name
			var srcPath = pk.path.join(sourceDirName, name);
			var destPath = pk.path.join(destDirName, name);
			var buffer = pk.fs.readFileSync(srcPath);
			pk.fs.writeFileSync(destPath, buffer);
		} 
	}
	for (var i=0; i<dirents.length; i++){
		var dirent = dirents[i];
		if (dirent.isDirectory()){
			copyDirectory(pk.path.join(sourceDirName, dirent.name), pk.path.join(destDirName, dirent.name));
		}
	}
}
