/*
 * This is the primary file for the API
 */


// Dependancy
var cluster = require('cluster');
var fs = require('fs');
var http = require('http');
var https = require('https');
var os = require('os');
var url = require('url');
var StringDecoder = require('string_decoder').StringDecoder;
var config = require('./config');


// All ther server logic for both http and https
var unifiedServer = function(req, res) {

	// Get the URL and parse
	var parsedUrl = url.parse(req.url, true);

	// Get the path from that url
	var path = parsedUrl.pathname;
	var trimmedPath = path.replace(/^\/+|\/+$/g, '');

	// Get the http method
	var method = req.method.toLowerCase();

	// Get the query string as an object
	var queryStringObject = parsedUrl.query;

	// Get the headers as an object
	var headers = req.headers;

	// Get the payload, if there is any
	var decoder = new StringDecoder('utf-8');
	var buffer = '';
	req.on('data', function(data) {
		buffer += decoder.write(data);
	});

	req.on('end', function() {
		buffer += decoder.end();
		// Choose the handler this request should go to
		// If one is not found, choose the notfound handler

		var chosenHandler = typeof(router[trimmedPath]) !== 'undefined' ? router[trimmedPath] : handlers.notFound;

		var data  = {
			trimmedPath: trimmedPath,
			queryStringObject: queryStringObject,
			method: method,
			headers: headers,
			payload: buffer
		};
		// Route the request
		chosenHandler(data, function (statusCode, payload) {
			// Use the status code or default to 2000
			statusCode = typeof(statusCode) === 'number' ? statusCode: 200;
			// Use the payload supplied or default to an empty object
			payload = typeof(payload) === 'object' ? payload : {};

			// Convert the payload to a string
			var payloadString = JSON.stringify(payload);

			// Return a response
			res.setHeader('Content-Type', 'application/json');
			res.writeHead(statusCode);
			res.end(payloadString);
			console.log('We are returning: ', statusCode, payloadString);
		});
	});

};

// Define the handlers
var handlers = {};


// Ping handler
handlers.ping = function(data, callback) {
	callback(200);
}

handlers.hello = function(data, callback) {
	callback(200, {
		'timestamp' : (new Date()).toISOString(),
		'pid' : process.pid,
		'message' : 'Hello'
	});
}

// Not found handler
handlers.notFound = function(data, callback) {
	callback(404);
};

// Define a request router
var router = {
	'ping': handlers.ping,
	'hello': handlers.hello,
}

handlers.startTheServer = function() {
	// Instiating the HTTP server
	var httpServer = http.createServer(function(req, res) {
		unifiedServer(req, res);
	});

	// Instatiate the HTTPS server
	var httpsServerOptions = {
		'key' : fs.readFileSync('./https/key.pem'),
		'cert' : fs.readFileSync('./https/cert.pem')
	};

	var httpsServer = https.createServer(httpsServerOptions, function(req, res) {
		unifiedServer(req, res);
	});

	// Start the HTTP server.
	httpServer.listen(config.httpPort, function() {
		console.log("The server is listening on port " + config.httpPort);
	});

	// Start the HTTPS server.
	httpsServer.listen(config.httpsPort, function() {
		console.log("The server is listening on port " + config.httpsPort);
	});

}; 


if (cluster.isMaster) {
	for(var i = 0; i < os.cpus().length; i++){
		cluster.fork();
	}

	cluster.on('exit', function (worker, code, signal) {
		console.log('worker %d died (%s).', worker.process.pid, signal || code);
		cluster.fork();
	});
} else {
	handlers.startTheServer();
}
