/*
 * Server related tasks
 */


// Dependancy
var fs = require('fs');
var http = require('http');
var https = require('https');
var url = require('url');
var path = require('path');
var StringDecoder = require('string_decoder').StringDecoder;
var config = require('../etc/config');
var handlers = require('./handlers');
var uihandlers = require('./uihandlers');
var helpers = require('./helpers');

var util = require('util');
var debug = util.debuglog('server');



// Inistantiate a server object
var server = {};

// The server should respond to all the requrest with a string

// Instiating the HTTP server
server.httpServer = http.createServer(function(req, res) {
	server.unifiedServer(req, res);
});

// Instatiate the HTTPS server
server.httpsServerOptions = {
	'key' : fs.readFileSync(path.join(__dirname, '/../https/key.pem')),
	'cert' : fs.readFileSync(path.join(__dirname, '/../https/cert.pem'))
};

server.httpsServer = https.createServer(server.httpsServerOptions, function(req, res) {
	server.unifiedServer(req, res);
});


// All ther server logic for both http and https
server.unifiedServer = function(req, res) {

	// Get the URL and parse
	var parsedUrl = url.parse(req.url, true);

	// Get the path from that url, remove any leading and trailing slashes, and split the path components
	var path = parsedUrl.pathname.replace(/^\/+|\/+$/g, '').split('/');

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

		var chosenHandler = typeof(server.router[path[0]]) !== 'undefined' ? server.router[path[0]] : handlers.notFound;

		var data  = {
			path: path,
			queryStringObject: queryStringObject,
			method: method,
			headers: headers,
			payload: helpers.parseJsonToObject(buffer)
		};
		// Route the request
		chosenHandler(data, function (statusCode, payload, contentType) {
			// Use the status code or default to 2000
			statusCode = typeof(statusCode) === 'number' ? statusCode: 200;

			// Content type
			contentType = typeof(contentType) == 'string' ? contentType : 'application/json';

			var payloadString = payload;
			if (contentType == 'application/json') {
				payload = typeof(payload) === 'object' ? payload : {};
				payloadString = JSON.stringify(payload);
			}
			// Return a response
			res.setHeader('Content-Type', contentType);
			res.writeHead(statusCode);
			res.end(payloadString);

			// If the response is 200, print green. Otherwise, print red
			if (statusCode == 200) {
				debug('\x1b[32m%s\x1b[0m', method.toUpperCase() + ' /' +  path.join('/') + ' ' + statusCode);
			} else {
				debug('\x1b[31m%s\x1b[0m', method.toUpperCase() + ' /' +  path.join('/') + ' ' + statusCode);
			}
		});
	});

};

// Define a request router
server.router = {
	'': uihandlers.index,
	'favicon.ico': uihandlers.favicon,
	'public': uihandlers.public,

	'account': uihandlers.account,
	'order': uihandlers.order,
	'payment': uihandlers.payment,

	'users': handlers.users,
	'tokens': handlers.tokens,
	'items': handlers.items,
	'carts': handlers.carts,
	'orders': handlers.orders,
	'pay': handlers.pay
}

server.init = function() {
	// Start the HTTP server.
	server.httpServer.listen(config.httpPort, function() {
		console.log('\x1b[36m%s\x1b[0m', "The server is listening on port " + config.httpPort);
	});

	// Start the HTTPS server.
	server.httpsServer.listen(config.httpsPort, function() {
		console.log('\x1b[35m%s\x1b[0m', "The server is listening on port " + config.httpsPort);
	});
}

module.exports = server;
