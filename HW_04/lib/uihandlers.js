
var fs = require('fs');
var path = require('path');

uihandlers = {};

uihandlers.index = function (data, callback) {
	fs.readFile(__dirname + '/../public/index.html', 'utf-8', function (err, data) {
		if (err) {
			callback(503, {'Error' : 'Failed to read index.html'});
			return;
		}

		callback(200, data, 'html');
	});
};

uihandlers.favicon = function (data, callback) {
	fs.readFile(__dirname + '/../public/assets/favicon.ico', function (err, data) {
		if (err) {
			callback(503, {'Error': 'Error reading the icon file'});
			return;
		}
		callback(200, data, 'image/x-icon');
	});
};

uihandlers.public = function (data, callback) {
	var fileName = __dirname + '/../' + data.path.join('/');
	fs.readFile(fileName, function (err, fileData) {
		if (err) {
			callback(503, {'Error': 'Failed to read: ' + data.path.join('/')});
			return;
		}
		var ext = path.extname(fileName);
		var contentType = 'plain';
		if (ext == '.css') {
			contentType = 'text/css';
		} else if (ext == '.js') {
			contentType = 'application/javascript';
		} else if (ext == '.png') {
			contentType = 'image/png';
		}

		callback(200, fileData, contentType);
	});
};

uihandlers.account = function (data, callback) {
	var account_route = {
		'account/create': uihandlers.accountCreate,
		'account/update': uihandlers.accountUpdate,
		'account/delete': uihandlers.accountDelete
	};

	var uiAccountHandler = account_route[data.path.join('/')] || uihandlers.index;
	uiAccountHandler(data, callback);
};

uihandlers.accountCreate = function (data, callback) {
	fs.readFile(__dirname + '/../public/signup.html', 'utf-8', function (err, data) {
		if (err) {
			callback(503, {'Error' : 'Failed to read index.html'});
			return;
		}

		callback(200, data, 'html');
	});
};

uihandlers.accountUpdate = function (data, callback) {
	uihandlers.index(data, callback);
};

uihandlers.accountDelete = function (data, callback) {
	uihandlers.index(data, callback);
};

uihandlers.order = function (data, callback) {
	fs.readFile(__dirname + '/../public/order.html', 'utf-8', function (err, data) {
		if (err) {
			callback(503, {'Error' : 'Failed to read index.html'});
			return;
		}

		callback(200, data, 'html');
	});
};

uihandlers.payment = function (data, callback) {
	fs.readFile(__dirname + '/../public/payment.html', 'utf-8', function (err, data) {
		if (err) {
			callback(503, {'Error' : 'Failed to read index.html'});
			return;
		}

		callback(200, data, 'html');
	});
};
module.exports = uihandlers;
