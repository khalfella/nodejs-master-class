/*
 * A simple api wrapper for stripe CC payment
 */

//Dependancies
var https = require('https');
var qs = require('querystring');

var config = require('../etc/config');

var stripe = {};

stripe.createCreditCardToken = function(creditCardNumber, expMonth, expYear, cvc, callback) {

	var postData = qs.stringify({
		'card[number]': creditCardNumber,
		'card[exp_month]': expMonth,
		'card[exp_year]': expYear,
		'card[cvc]': cvc
	});

	var apiKey = config.stripe.apiKey;
	var authHeader = 'Basic ' + Buffer.from(apiKey).toString('base64');

	var requestOptions = {
		'hostname': config.stripe.hostname,
		'port': config.stripe.port,
		'path': '/v1/tokens',
		'method': 'POST',
		'headers': {
			'Content-Type': 'application/x-www-form-urlencoded',
			'Content-Length': Buffer.byteLength(postData),
			'Authorization': authHeader
		}
	};

	var req = https.request(requestOptions, function (res) {

		if (res.statusCode !== 200) {
			callback('Request Failed: ' + res.statusCode);
			res.resume();
			return;
		}

		var rawData = '';
		res.on('data', function(chunk) {
			rawData += chunk;
		});
		res.on('end', function() {
			try {
				var rep = JSON.parse(rawData);
				callback(null, rep.id);
			} catch(e) {
				callback(e.message);
			}
		});
	});

	req.on('error', function (err) {
		callback(err);
	});

	req.on('timeout', function(err) {
		req.abort();
		callback('Request timeed out');
	});

	req.end(postData);
};


stripe.createCreditCardCharge = function(amount, currency, source, user_uuid, order_uuid, callback) {
	var postData = qs.stringify({
		'amount' : amount,
		'currency' : 'usd',
		'source' : source,
		'metadata[user_uuid]': user_uuid,
		'metadata[order_uuid]': order_uuid
	});

	var apiKey = config.stripe.apiKey;
	var authHeader = 'Basic ' + Buffer.from(apiKey).toString('base64');

	var requestOptions = {
		'hostname': config.stripe.hostname,
		'port': config.stripe.port,
		'path': '/v1/charges',
		'method': 'POST',
		'headers': {
			'Content-Type': 'application/x-www-form-urlencoded',
			'Content-Length': Buffer.byteLength(postData),
			'Authorization': authHeader
		}
	};

	var req = https.request(requestOptions, function (res) {
		if (res.statusCode !== 200) {
			callback('Request Failed: ' + res.statusCode);
			res.resume();
			return;
		}

		var rawData = '';
		res.setEncoding('utf8');
		res.on('data', function(chunk) {
			rawData += chunk;
		});
		res.on('end', function() {
			try {
				var rep = JSON.parse(rawData);
				callback(null, rep.id);
			} catch(e) {
				callback(e.message);
			}
		});
	});

	req.on('error', function (err) {
		callback(err);
	});

	req.on('timeout', function(err) {
		req.abort();
		callback('Request timeed out');
	});

	req.end(postData);
};


stripe.chargeForOrder = function(amount, currency, user_uuid, order_uuid, creditCardNumber, expMonth, expYear, cvc, callback) {
	stripe.createCreditCardToken(creditCardNumber, expMonth, expYear, cvc, function(err, token) {
		if (err) {
			callback('Error creating credit card token');
			return;
		}
		stripe.createCreditCardCharge(amount, currency, token, user_uuid, order_uuid, function (err, charge) {
			if (err) {
				callback('Failed to create a charge object');
				console.log('##### Failed', err);
				return;
			}
			callback(null, charge);
		});
	});
};


// Export the stripe container object
module.exports = stripe;
