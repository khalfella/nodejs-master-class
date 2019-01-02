/*
 * This file is just helpers for various tasks
 */


// Dependancies
var https = require('https');
var crypto = require('crypto');
var querystring = require('querystring');
var config = require('../etc/config');

// Container for all the helpers

var helpers = {};

// Create a SHA256 hash function
helpers.hash = function (str) {
	if (typeof(str) == 'string' && str.length > 0) {
		var hash = crypto.createHmac('sha256', config.hashingSecrete).update(str).digest('hex');
		return hash;
	} else {
		return false;
	}
}

// Parse a JSON string to an object in all cases without throwing.
helpers.parseJsonToObject = function(str) {
	try {
		var obj = JSON.parse(str);
		return obj;
	} catch(e) {
		return{};
	}
}


// Create a random uuid in the format xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
// Note: This is just a radom string, it is not following IETF RFC4122
helpers.createUUID = function () {
	var str = '';
	var i;
	var hex = '0123456789abcdef';
	for (i = 0; i < 32; i++) {
		// Add dash seperators
		if (i == 8 || i == 12 || i == 16 || i == 20) {
			str += '-';
		}
		// Append a random character
		var rand = Math.floor(Math.random() * 16);
		str += hex[rand];
	}

	// return the final string
	return str;
};

helpers.validateUserName = function (userName) {
	if (typeof(userName) != 'string' || userName.length < 8 ||
	    /\s/g.test(userName)) {
		return null;
	}
	return userName;
};
helpers.validateName = function (name) {
	return helpers.validateUserName(name);
};

helpers.validatePassword = function (password) {
	if (typeof(password) != 'string' || password.length < 8) {
		return null;
	}
	return password;
};

helpers.validateEmail = function (email) {
	var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
	if (typeof(email) == 'string' && re.test(email)) {
		return email.toLowerCase();
	}
	return null;
}
helpers.validateAddress = function (address) {
	if (typeof(address) == 'string' && address.length > 10) {
		return address;
	}
	return null;
};

helpers.validateUUID = function (uuid) {
	var re = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
	if (typeof(uuid) == 'string' && re.test(uuid)) {
		return uuid;
	}
	return null;
};

helpers.validateCreditCardNumber = function(ccNumber) {
	var re = /^[0-9]{16}$/i;
	if (typeof(ccNumber) == 'string' && re.test(ccNumber)) {
		return ccNumber;
	}
	return null;
};

helpers.validateCreditCardExpMonth = function (ccExpMonth) {
	if (typeof(ccExpMonth) == 'number' && /^(0[1-9]|1[0-2])$/.test(ccExpMonth)) {
		return ccExpMonth;
	}
	return null;
};

helpers.validateCreditCardExpYear = function (ccExpYear) {
	return (typeof(ccExpYear) == 'number' && /^(19[5-9]\d|20[0-4]\d|2050)$/.test(ccExpYear)) ? ccExpYear : null;
};

helpers.validateCreditCardCVC = function (ccCVC) {
	return (typeof(ccCVC) == 'number' && /^[0-9]{3}$/.test(ccCVC)) ? ccCVC : null;
};



module.exports = helpers;
