/*
 * These are CLI related tasks
 */

// Dependancies
var _data = require('./data');
var readline = require('readline');
var util = require('util');
var debug = util.debuglog('cli');
var items_menu = require('../etc/items');
var helpers = require('./helpers');


var events = require('events');


class _events extends events{};





var e = new _events();


// Instantiate the CLI module object
var cli = {};


// Input handlers

e.on('help', function (str) {
	cli.responders.help();
});
e.on('menu', function (str) {
	cli.responders.menu();
});

e.on('recent orders', function (str) {
	cli.responders.recentOrders();
});

e.on('order info', function (str) {
	cli.responders.orderInfo(str);
});

e.on('recent users', function (str) {
	cli.responders.recentUsers();
});

e.on('user info', function (str) {
	cli.responders.userInfo(str);
});

// Responders object

cli.responders = {};

cli.responders.help = function() {
	var commands = {
	    'help': 'Show this help message',
	    'menu': 'View all the current menu items',
	    'recent orders': 'View all the recent orders in the system (orders placed in the last 24 hours)',
	    'order info':' Lookup the details of a specific order by order ID',
	    'recent users': 'View all the users who have signed up in the last 24 hours',
	    'user info':'Lookup the details of a specific user by email address'
	};

	// show a headers that is as wide as the screen
	cli.horizontalLine();
	cli.centered('CLI MANUAL');
	cli.horizontalLine();
	cli.verticalSpace(1);

	// showt he help
	for (var key in commands) {
		if (commands.hasOwnProperty(key)) {
			var value = commands[key];
			var line = '\x1b[33m' + key + '\x1b[0m';
			var padding = 60 - line.length;

			for (var i = 0; i < padding; i++) {
				line += ' ';
			}

			line += value;

			console.log(line);
			cli.verticalSpace(1);
		}
	}

	cli.verticalSpace(1);
	cli.horizontalLine();
};

cli.verticalSpace = function(lines) {
	lines = typeof(lines) == 'number' &&  lines > 0 ? lines : 1;
	for (var i = 0; i < lines; i++) {
		console.log('');
	}
};

cli.horizontalLine = function() {
	//Get the available screen size
	var width = process.stdout.columns;

	var line = '';
	for(i = 0; i < width; i++) {
		line += '-';
	}

	console.log(line);
};

cli.centered = function(str) {
	str = typeof(str) == 'string' && str.length > 0 ? str.trim() : '';
	var width = process.stdout.columns;
	// calculate the left padding
	var leftPadding = Math.floor((width - str.length) / 2);
	// put left padded spaces
	var line = '';
	for (var i = 0; i < leftPadding; i++) {
		line += ' ';
	}

	line += str;

	console.log(line);
}


cli.responders.menu = function () {
	items_menu.forEach(function(item) {
		console.log('%s\t%s\t%d\t%s', item.uuid, item.name, item.price, item.description);
	});
};

cli.responders.recentOrders = function () {
	_data.list('orders', function (err, orderUUIDs) {
		if (err) {
			console.log('Failed to retreive the orders list');
			return;
		}
		orderUUIDs.forEach(function(orderUUID) {
			_data.read('orders', orderUUID, function(err, orderData) {
				if (err) {
					console.log('Failed to retrieve order information ' + orderUUID);
					return;
				}

				// Order placed within the past 24 horus
				if (orderData.creation_date > Date.now() / 1000 - 24 * 60 * 60) {
					console.log('%s\t%s\t%s', orderData.uuid, orderData.user_email, orderData.total_price);
				}

			});
		});
	});
};

cli.responders.orderInfo = function(str) {
	//Get the order uuid
	var orderUUID = helpers.validateUUID(str.split('--')[1]);
	if (!orderUUID) {
		console.log('Invalid order UUID');
		return;
	}

	_data.read('orders', orderUUID, function (err, orderData) {
		if (err) {
			console.log('Failed to retreive order information' + orderUUID);
			return;
		}

		console.log(JSON.stringify(orderData, null, 2));
	});
};

cli.responders.recentUsers = function () {
	_data.list('users', function (err, userUUIDs) {
		if (err) {
			console.log('Failed to retreive the users\' list');
			return;
		}
		userUUIDs.forEach(function(userUUID) {
			_data.read('users', userUUID, function(err, userData) {
				if (err) {
					console.log('Failed to retrieve user information ' + userUUID);
					return;
				}

				if (userData.creation_date > Date.now() / 1000 - 24 * 60 * 60) {
					console.log('%s\t%s\t%s', userData.uuid, userData.userName, userData.email);
				}

			});
		});
	});
};

cli.responders.userInfo = function(str) {
	var userEmail = helpers.validateEmail(str.split('--')[1]);
	if (!userEmail) {
		console.log('Invalid email address');
		return;
	}
	_data.list('users', function(err, userUUIDs) {
		if (err) {
			console.log('Failed to retrieve the users list');
			return;
		}
		userUUIDs.forEach(function(userUUID) {
			_data.read('users', userUUID, function (err, userData) {
				if (err) {
					console.log('Failed to retrieve user information ' + userUUID);
					return;
				}

				if (userData.email === userEmail) {
					console.log(userData);
				}
			});
		});
	});
};





cli.processInput = function(str) {
	str = typeof(str) == 'string' && str.trim().length > 0 ? str.trim() : false;

	if (!str) {
		return;
	}

	// Codify the unique strings that identify the unique questions allowed to be asked
	var uniqueInputs = [
		'help',
		'menu',
		'recent orders',
		'order info',
		'recent users',
		'user info'
	];

	var matchFound = false;
	var counter = 0;
	uniqueInputs.some(function(input) {
		if (str.toLowerCase().indexOf(input) > -1) {
			matchFound = true;
			//emit an event matching the unique input and include the full string given by the user
			e.emit(input, str);
			return true;
		}
	});

	if (!matchFound) {
		console.log('Sorry, try again');
	}
};



// Define an init script
cli.init = function() {
	// Send the start messsage to the console in dark blue
	console.log('\x1b[34m%s\x1b[0m', 'The CLI is running');

	// Start the interface
	var _interface = readline.createInterface({
		'input': process.stdin,
		'output': process.stdout,
		'prompt': ''
	});

	// Create an initiali promp
	_interface.prompt();

	_interface.on('line', function(str) {
		//Send to the input processon
		cli.processInput(str);
		//Re-initialize the promp afterwards
		_interface.prompt();
	});

	// If the user stops the cli
	_interface.on('close', function() {
		process.exit(0);
	});
};













module.exports = cli;
