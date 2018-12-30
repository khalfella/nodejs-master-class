/*
 * These are the request handlers
 */



// Dependancies
var _data = require('./data');
var helpers = require('./helpers');
var items_menu = require('../etc/items');
var stripe = require('./stripe');
var mailgun = require('./mailgun');


var config = require('../etc/config');



var handlers = {};

handlers.notFound = function(data, callback) {
	callback(405, {'Erro': 'Invalid URL path'});
};

handlers.users = function(data, callback) {
	var acceptableMethods = ['post', 'get', 'put', 'delete'];
	if (acceptableMethods.indexOf(data.method) > -1) {
		handlers._users[data.method](data, callback);
		return;
	}

	callback(405);
}



// Container for users submethod
handlers._users = {};

handlers._users.getUserUUID = function (userName, callback) {
	_data.list('users', function (err, userUUIDs) {
		if (err) {
			callback(err);
			return;
		}

		if (userUUIDs.length == 0) {
			callback('Could not find the user');
			return;
		}

		var idx = 0;
		var user_uuid = undefined;
		userUUIDs.forEach(function (userUUID) {	
			_data.read('users', userUUID, function (err, userData) {

				// If no error, check to see if this is the user
				if (!user_uuid && !err && userData.userName == userName) {
					user_uuid = userData.uuid;
				}

				// If this is the last record to process
				if (++idx == userUUIDs.length) {
					// In case we have found the user
					if (user_uuid) {
						callback(null, user_uuid);
						return;
					}

					//Otherwise, we couldn't find the user
					callback('Could not find the user');
				}
			});
		});
	});
};

// Users - post
handlers._users.post = function (data, callback) {
	if (data.path.length !== 1 || data.path[0] !== 'users') {
		callback(400, {'Error': 'Invalid URL'});
		return;
	}

	var userName = helpers.validateUserName(data.payload.userName);
	var firstName = helpers.validateName(data.payload.firstName);
	var lastName = helpers.validateName(data.payload.lastName);
	var password = helpers.validatePassword(data.payload.password);
	var email = helpers.validateEmail(data.payload.email);
	var address = helpers.validateAddress(data.payload.address);

	if (!userName || !firstName || !lastName || !password || !email || !address) {
		callback(400, {'Error': 'Invalid or missing input'});
		return;
	}

	handlers._users.getUserUUID(userName, function (err, userUUID) {
		if (!err) {
			// A user with the same userName already exists.
			callback(400, {'Error': 'Username is already used'});
			return;
		}


		//TODO: In case of an error, we assume it means the user doesn't exist.
		//This needs to be fixed in the futrue.
		var user = {
			'uuid' : helpers.createUUID(),
			'userName' : userName,
			'firstName' : firstName,
			'lastName' : lastName,
			'hashedPassword' : helpers.hash(password),
			'email' : email,
			'address' : address
		};

		_data.create('users', user.uuid, user, function(err) {
			if (err) {
				callback(503, {'Error': 'Failed to save the user informatoin'});
				return;
			}

			delete user.hashedPassword;
			callback(201, user);
		});
	});
};

// Users - get
handlers._users.get = function (data, callback) {

	if (data.path.length != 2 || data.path[0] != 'users' ||
	    !helpers.validateUUID(data.headers.token) ||	// Token is a UUID
	    !helpers.validateUUID(data.path[1])) {		// User ID is a UUID in the path
		callback(400, {'Error': 'Invalid path or missing token information'});
		return;
	}

	var token = data.headers.token;
	var userUUID = data.path[1];

	handlers._tokens.verifyToken(token, userUUID, function (err) {
		if (err) {
			callback(403, {'Error': 'Invaid token/username combination'});
			return;
		}

		_data.read('users', userUUID, function(err, user) {
			if (err) {
				callback(503, {'Error': 'Failed to retreive user informatoin'});
				return;
			}

			delete user.hashedPassword;
			callback(200, user);
		});
	});
};

// Users - put
handlers._users.put = function (data, callback) {
	if (data.path.length != 2 || data.path[0] != 'users' ||
	    !helpers.validateUUID(data.headers.token) ||	// Token is a UUID
	    !helpers.validateUUID(data.path[1])) {		// User ID is a UUID in the path
		callback(400, {'Error': 'Invalid path or missing token information'});
		return;
	}

	var token = data.headers.token;
	var userUUID = data.path[1];

	handlers._tokens.verifyToken(token, userUUID, function (err) {
		if (err) {
			callback(403, {'Error': 'Invaid token/username combination'});
			return;
		}

		var un, pwd, fn, ln, em, add;
		if ((data.payload.userName && !(un = helpers.validateUserName(data.payload.userName))) ||
		    (data.payload.password && !(pwd = helpers.validatePassword(data.payload.password))) ||
		    (data.payload.firstName && !(fn = helpers.validateName(data.payload.firstName))) ||
		    (data.payload.lastName && !(ln = helpers.validateName(data.payload.lastName))) ||
		    (data.payload.email && !(em = helpers.validateEmail(data.payload.email))) ||
		    (data.payload.address && !(add = helpers.validateAddress(data.payload.address)))) {
			callback(400, {'Error': 'Invalid dat'});
			return;
		}

		_data.read('users', userUUID, function(err, userData) {
			if (err) {
				callback(503, {'Error': 'Failed to retreive the user information'});
				return;
			}

			function doUpdateUserInformation() {
	
				userData.userName = un || userData.userName;
				userData.hashedPassword  = pwd ? helpers.hash(pwd) : userData.hashedPassword;
				userData.firstName = fn || userData.firstName;
				userData.lastName = ln || userData.lastName;
				userData.email = em || userData.email;
				userData.address = add || userData.address;

				//Update the user information
				_data.update('users', userUUID, userData, function (err) {
					if (err) {
						callback(503, {'Error': 'Failed to store the user information'});
						return;
					}

					delete userData.hashedPassword;
					callback(201, userData);
				});
			}


			// Check the new username doesn't exist
			if (un && un !== userData.userName) {
				handlers._users.getUserUUID(un, function (err, _) {
					if (err) {
						doUpdateUserInformation();
						return;
					}

					callback(400,{'Error': 'Username already taken'});
				});
				return;
			}

			doUpdateUserInformation();
		});
	});
};

// Users - delete
handlers._users.delete = function (data, callback) {
	if (data.path.length != 2 || data.path[0] != 'users') {
		callback(400, {'Error': 'Invalid URL specified'});
		return;
	}

	var user_uuid = helpers.validateUUID(data.path[1]);
	var token = helpers.validateUUID(data.headers.token);
	if (!user_uuid || !token) {
		callback(400, {'Error': 'Missing arguments'});
		return;
	}

	handlers._tokens.verifyToken(token, user_uuid, function (err) {
		if (err) {
			callback(404, {'Error': 'Invalid credentials'});
			return;
		}

		_data.list('tokens', function (err, tokenUUIDs) {
			tokenUUIDs.forEach(function(tokenUUID) {
				_data.delete('tokens', tokenUUID, function(err) {
					// We don't track errors becuase it is not very serious issue.
					// Having a dangling token should not be a big issue since new accounts
					// will have new uuids anyway.
				});
			});
		});

		// Don't wait for all the tokens to be deleted
		_data.delete('users', user_uuid, function(err) {
			if (err) {
				callback(503, {'Error': 'Failed to remove the user'});
				return;
			}
			callback(200, {'uuid': user_uuid});
		});
	});
};

handlers.tokens = function(data, callback) {
	var acceptableMethods = ['post', 'get', 'put', 'delete'];
	if (acceptableMethods.indexOf(data.method) > -1) {
		handlers._tokens[data.method](data, callback);
		return;
	}

	callback(405);
}

handlers._tokens = {};


// Creates a token
// Required parameters: userUUID, password
// Optional parameters: noe
handlers._tokens.post = function (data, callback) {

	if (data.path.length != 1 || data.path[0] != 'tokens') {
		callback(400, {'Error': 'Invalid URL specified'});
		return;
	}

	var user_uuid = helpers.validateUUID(data.headers.user_uuid);
	var userName = helpers.validateUserName(data.headers.username);
	var password = helpers.validatePassword(data.headers.password);


	if (!(user_uuid || userName) || !password) {
		callback(400, {'Error': 'Missing parameters'});
		return;
	}

	function doCreateToken() {
		_data.read('users', user_uuid, function(err, user) {
			if (err) {
				callback(404, {'Error': 'User not found'});
				return;
			}

			if (helpers.hash(password) != user.hashedPassword) {
				callback(403, {'Error': 'Invalid password'});
				return;
			}

			// Now we know this is the user. Let us create the token.
			var token = {
				'uuid': helpers.createUUID(),
				'user_uuid': user_uuid,
				'expiration': Date.now() + 60 * 60 * 1000 * 24 // Valid for 24 hours
			};

			_data.create('tokens', token.uuid, token, function (err) {
				if (err) {
					callback(503, {'Error': 'Failed to save the token'});
					return;
				}
				callback(201, token);
			});
		});
	}

	if (!user_uuid && userName) {
		handlers._users.getUserUUID(userName, function (err, userUUID) {
			if (err) {
				callback(404, {'Error': 'User does not exist'});
				return;
			}

			user_uuid = userUUID;
			doCreateToken();
		});
		return;
	}

	// The user has specified the uuid. Go ahead and attempt to create the token.
	doCreateToken();
};



handlers._tokens.get = function (data, callback) {
	if (data.path.length != 2 || data.path[0] != 'tokens' || !helpers.validateUUID(data.path[1])) {
		callback(400, {'Error': 'Invalid URL specified'});
		return;
	}

	var token = data.path[1];
	_data.read('tokens', token, function(err, tokenData) {
		if (err) {
			callback(404, {'Error': 'The specified token does not exist'});
			return;
		}

		delete tokenData.user_uuid;		// Don't disclose the user UUID
		callback(200, tokenData);
	});
};



handlers._tokens.put = function (data, callback) {
	callback(405, {'Error': 'Not supported'});
};
handlers._tokens.delete = function (data, callback) {

	if (data.path.length != 2 || data.path[0] != 'tokens' || !helpers.validateUUID(data.path[1])) {
		callback(400, {'Error': 'Invalid URL specified'});
		return;
	}

	var token = data.path[1];
	var user_uuid = helpers.validateUUID(data.headers.user_uuid);

	if (!user_uuid) {
		callback(400, {'Error': 'Missing arguments'});
		return;
	}

	handlers._tokens.verifyToken(token, user_uuid, function (err) {
		if (err) {
			callback(403, {'Error': 'Invalid token/user_uuid combination'});
			return;
		}

		_data.delete('tokens', token, function (err) {
			if (err) {
				callback(503, {'Error': 'Failed to remove the token'});
				return;
			}

			callback(200, {'uuid': token});
		});
	});
};

handlers._tokens.verifyToken = function (token, userUUID, callback) {
	_data.read('tokens', token, function(err, tokenData) {
		if (err) {
			callback(err);
			return;
		}
		// The token belongs to the user and it not expired yet.
		if (tokenData.user_uuid == userUUID && tokenData.expiration > Date.now()) {
			callback(null);
			return;
		}

		callback('Invalid token');
	});
};

handlers.pay = function(data, callback) {
	var acceptableMethods = ['post'];
	if (acceptableMethods.indexOf(data.method) > -1) {
		handlers._pay[data.method](data, callback);
		return;
	}
	callback(405);
};

handlers._pay = {};

handlers._pay.post = function (data, callback) {
	var token = helpers.validateUUID(data.headers.token);
	var user_uuid = helpers.validateUUID(data.headers.user_uuid);

	var cart_uuid = helpers.validateUUID(data.payload.cart_uuid);
	var stripe_token_id = typeof(data.payload.stripe_token_id) == 'string' && data.payload.stripe_token_id.length > 5 ? data.payload.stripe_token_id : false;
	var stripe_charge_id = typeof(data.payload.stripe_charge_id) == 'string' && data.payload.stripe_charge_id.length > 5 ? data.payload.stripe_charge_id : false;

	if (!token || !user_uuid || !cart_uuid || !stripe_token_id || !stripe_charge_id) {
		callback(400, {'Error': 'Missing arguments'});
		return;
	}

	handlers._tokens.verifyToken(token, user_uuid, function (err) {
		if (err) {
			callback(403, {'Error': 'Invalid token/user_uuid combination'});
			return;
		}

		handlers._carts.getUserCart(user_uuid, function (err, cartData) {
			if (cartData.uuid != cart_uuid) {
				callback(403, {'Error': 'Invalid cart_uuid/user_uuid combination'});
				return;
			}

			// Verify stripe charge
			stripe.verifyPayment (stripe_token_id, stripe_charge_id, cart_uuid, function (err) {
				if (err) {
					callback(400, {'Error': 'error to verify the payment'});
					return;
				}

				stripe.captureTheCharge(stripe_charge_id, function (err) {
					if (err) {
						callback(400, {'Error': 'failed to capture the charge'});
						return;
					}

					cartData.charge_id = stripe_charge_id;
					mailgun.sendEmail(cartData.user_email,'Re:' +  cart_uuid,
					    JSON.stringify(cartData, null, 2), function (err) {
						if (err) {
							console.log('Failed to send the email');
							return;
						}
						console.log('Sent the email');
					});

					callback(200);
				});
			});
		});
	})
};

handlers.items = function(data, callback) {
	var acceptableMethods = ['get'];
	if (acceptableMethods.indexOf(data.method) > -1) {
		handlers._items[data.method](data, callback);
		return;
	}

	callback(405);
}



// Container for items submethod
handlers._items = {};

handlers._items.get = function (data, callback) {

	if (data.path.length != 1 || data.path[0] != 'items') {
		callback(400, {'Error': 'Invalid URL specified'});
		return;
	}

	var token = helpers.validateUUID(data.headers.token);
	var user_uuid = helpers.validateUUID(data.headers.user_uuid);
	if (!token || !user_uuid) {
		callback(400, {'Error': 'Missing arguments'});
		return;
	}

	handlers._tokens.verifyToken(token, user_uuid, function (err) {
		if (err) {
			callback(403, {'Error': 'Invalid token/user_uuid combination'});
			return;
		}
		callback(200, items_menu);
	});
};

handlers.carts = function(data, callback) {
	var acceptableMethods = ['post', 'get', 'put', 'delete'];
	if (acceptableMethods.indexOf(data.method) > -1) {
		handlers._carts[data.method](data, callback);
		return;
	}

	callback(405);
}

handlers._carts = {};

handlers._carts.getUserCart = function (userUUID, callback) {
	_data.list('carts', function (err, cartUUIDs) {
		if (err) {
			callback(err);
			return;
		}

		if (cartUUIDs.length == 0) {
			callback(null, null);
			return;
		}

		var idx = 0;
		var error = null;
		var user_cart = null;
		cartUUIDs.forEach(function(cartUUID) {
			_data.read('carts', cartUUID, function(err, cartData) {
				if (!user_cart && !err && cartData.user_uuid == userUUID) {
					user_cart = cartData;
				}

				if (err && !user_cart) {
					error = err;
				}

				if (++idx == cartUUIDs.length) {
					if (user_cart) {
						callback(null, user_cart);
						return;
					}
					callback(error, null);
				}
			});
		});
	});
};

handlers._carts.post = function(data, callback) {
	if (data.path.length != 1 || data.path[0] != 'carts') {
		callback(400, {'Error': 'Invalid URL specified'});
		return;
	}

	var token = helpers.validateUUID(data.headers.token);
	var user_uuid = helpers.validateUUID(data.headers.user_uuid);
	if (!token || !user_uuid) {
		callback(400, {'Error': 'Missing arguments'});
		return;
	}

	handlers._tokens.verifyToken(token, user_uuid, function (err) {
		if (err) {
			callback(403, {'Error': 'Invalid token/user_uuid combination'});
			return;
		}

		handlers._carts.getUserCart(user_uuid, function (err, cartData) {
			if (err) {
				callback(503, {'Error': 'Error checking the user\'s carg'});
				return;
			}

			if (cartData) {
				callback(201, cartData);
				return;
			}

			_data.read('users', user_uuid, function (err, userData) {
				if (err) {
					callback(503, {'Error': 'Failed to retreive the user information'});
					return;
				}

				var cart = {
				    "uuid" : helpers.createUUID(),
				    "user_uuid" : user_uuid,
				    "user_email" : userData.email,
				    "items" : [],
				    "total_price" : 0
				};

				_data.create('carts', cart.uuid, cart, function (err) {
					if (err) {
						callback(503, {'Error': 'Error saving the user\'s cart'});
						return;
					}
					callback(201, cart);
				});
			});
		});
	});
};


handlers._carts.get = function(data, callback) {
	if (data.path.length != 1 || data.path[0] != 'carts') {
		callback(400, {'Error': 'Invalid URL specified'});
		return;
	}

	var token = helpers.validateUUID(data.headers.token);
	var user_uuid = helpers.validateUUID(data.headers.user_uuid);
	if (!token || !user_uuid) {
		callback(400, {'Error': 'Missing arguments'});
		return;
	}

	handlers._tokens.verifyToken(token, user_uuid, function (err) {
		if (err) {
			callback(403, {'Error': 'Invalid token/user_uuid combination'});
			return;
		}

		handlers._carts.getUserCart(user_uuid, function (err, cartData) {
			if (err) {
				callback(503, {'Error': 'Error checking the user\'s carg'});
				return;
			}

			if (!cartData) {
				callback(404, {'Error': 'The user does not have a cart'});
				return;
			}

			callback(200, cartData);
		});
	});
};


handlers._carts.put = function(data, callback) {
	if (data.path.length != 2 || data.path[0] != 'carts' || !helpers.validateUUID(data.path[1])) {
		callback(400, {'Error': 'Invalid URL specified'});
		return;
	}

	var cartUUID = data.path[1];
	var token = helpers.validateUUID(data.headers.token);
	var user_uuid = helpers.validateUUID(data.headers.user_uuid);

	if (!token || !user_uuid) {
		callback(400, {'Error': 'Missing arguments'});
		return;
	}

	var items_updated = data.payload;
	if (typeof (items_updated) != 'object' || !(items_updated instanceof Array)) {
		callback(400, {'Error': 'Invalid payload 1'});
		return;
	}

	for (var i = 0; i < items_updated.length; i++) {
		var iu = items_updated[i];


		if (typeof (iu) == 'object' &&
		    helpers.validateUUID(iu.uuid) &&
		    items_menu.some(function(i) { return (iu.uuid === i.uuid);}) &&
		    typeof (iu.quantity) == 'number' &&
		    iu.quantity % 1 == 0 && iu.quantity >= 0) {
			continue;
		}
		callback(400, {'Error': 'Invalid payload 2'});
		return;
	}


	handlers._tokens.verifyToken(token, user_uuid, function (err) {
		if (err) {
			callback(403, {'Error': 'Invalid token/user_uuid combination'});
			return;
		}

		handlers._carts.getUserCart(user_uuid, function (err, cartData) {
			if (err) {
				callback(503, {'Error': 'Error checking the user\'s carg'});
				return;
			}

			if (!cartData) {
				callback(404, {'Error': 'The user does not have a cart'});
				return;
			}

			if (cartData.uuid !== cartUUID) {
				callback(403, {'Error': 'The user does not have permisson to update the cart'});
				return;
			}

			items_updated.forEach(function(ui) {
				var found = false;
				cartData.items.forEach(function (ci) {
					if (ci.uuid == ui.uuid) {
						ci.quantity = ui.quantity;
						found = true;
					}
				});

				if (!found) {
					cartData.items.push({
					    "uuid" : ui.uuid,
					    "quantity" : ui.quantity
					});
				}
			});

			cartData.items = cartData.items.filter(function(ci) { return ci.quantity; });

			// Calculate the new price of the cart
			cartData.total_price = 0;
			cartData.items.forEach(function(ci) {
				var added = false;
				items_menu.forEach(function (im) {
					if (ci.uuid == im.uuid) {
						cartData.total_price += im.price * ci.quantity;
						added = true;
					}
				});

				if (!added) {
					callback(503, {'Error': 'Failed to find some of the items in the menu'});
					return;
				}
			});

			_data.update('carts', cartData.uuid, cartData, function(err) {
				if (err) {
					callback(503, {'Error': 'Error saving the updated cart'});
					return;
				}

				callback(201, cartData);
			});
		});
	});
};

handlers._carts.delete = function(data, callback) {
	if (data.path.length != 2 || data.path[0] != 'carts' || !helpers.validateUUID(data.path[1])) {
		callback(400, {'Error': 'Invalid URL specified'});
		return;
	}

	var cartUUID = data.path[1];
	var token = helpers.validateUUID(data.headers.token);
	var user_uuid = helpers.validateUUID(data.headers.user_uuid);

	if (!token || !user_uuid) {
		callback(400, {'Error': 'Missing arguments'});
		return;
	}

	handlers._tokens.verifyToken(token, user_uuid, function (err) {
		if (err) {
			callback(403, {'Error': 'Invalid token/user_uuid combination'});
			return;
		}

		handlers._carts.getUserCart(user_uuid, function (err, cartData) {
			if (err) {
				callback(503, {'Error': 'Error checking the user\'s carg'});
				return;
			}

			if (!cartData) {
				callback(404, {'Error': 'The user does not have a cart'});
				return;
			}

			if (cartData.uuid !== cartUUID) {
				callback(403, {'Error': 'The user does not have permisson to update the cart'});
				return;
			}

			_data.delete('carts', cartUUID, function (err) {
				if (err) {
					callback(503, {'Error': 'Error deleting the cart'});
					return;
				}

				callback(200);
			});
		});
	});
};

handlers.orders = function(data, callback) {
	var acceptableMethods = ['post', 'get', 'delete'];
	if (acceptableMethods.indexOf(data.method) > -1) {
		handlers._orders[data.method](data, callback);
		return;
	}

	callback(405);
}

// Container for orders submethod
handlers._orders = {};

handlers._orders.post = function (data, callback) {
	if (data.path.length != 1 || data.path[0] != 'orders') {
		callback(400, {'Error': 'Invalid URL specified'});
		return;
	}

	var token = helpers.validateUUID(data.headers.token);
	var user_uuid = helpers.validateUUID(data.headers.user_uuid);
	var cart_uuid = helpers.validateUUID(data.payload.cart_uuid);
	var creditCardNumber = helpers.validateCreditCardNumber(data.payload.creditCardNumber);
	var creditCardExpMonth = helpers.validateCreditCardExpMonth(data.payload.creditCardExpMonth);
	var creditCardExpYear = helpers.validateCreditCardExpYear(data.payload.creditCardExpYear);
	var creditCardCVC = helpers.validateCreditCardCVC(data.payload.creditCardCVC);

	if (!token || !user_uuid || !cart_uuid || !creditCardNumber || !creditCardExpMonth || !creditCardExpYear || !creditCardCVC) {
		callback(400, {'Erro': 'Missing fields'});
		return;
	}

	handlers._tokens.verifyToken(token, user_uuid, function(err) {
		if (err) {
			callback(403, {'Error': 'Invalid credentials'});
			return;
		}
		handlers._carts.getUserCart(user_uuid, function (err, cartData) {
			if (err) {
				callback(503, {'Error': 'Error checking the user\'s carg'});
				return;
			}

			if (!cartData) {
				callback(404, {'Error': 'The user does not have a cart'});
				return;
			}

			if (cartData.uuid !== cart_uuid) {
				callback(403, {'Error': 'The user does not have permisson to use the cart'});
				return;
			}

			var order = {
				'uuid': helpers.createUUID(),
				'user_uuid': user_uuid,
				'user_email': cartData.user_email,
				'creation_date': Date.now(),
				'total_price': cartData.total_price,
				'items': cartData.items.map(function(ci) {
					var unit_price = items_menu.filter(function(im) {
						return (im.uuid == ci.uuid);
					})[0].price;

					return {
						'uuid': ci.uuid,
						'quantity': ci.quantity,
						'price': unit_price * ci.quantity
					};
				})
			};

			_data.create('orders', order.uuid, order, function (err) {
				if (err) {
					callback(503, {'Error': 'Failed to save the customer order'});
					return;
				}

				stripe.chargeForOrder(order.total_price, 'usd', user_uuid, order.uuid,
				    creditCardNumber, creditCardExpMonth, creditCardExpYear, creditCardCVC,
				    function (err, charge_id) {

					if (err) {
						callback(503, {'Error':'Failed to charge the customer\'s for the order'});
						return;
					}

					order['charge_id'] = charge_id;
					callback(201, order);

					mailgun.sendEmail(order.user_email, 'Order: ' + order.uuid,
					    JSON.stringify(order, null, 2), function (err, email_id) {
					});

				});


				//Now we have put the order, remove the cart
				/*
				_data.delete('carts', cartData.uuid, function (err) {
					if (err) {
						console.log('Failed to remove the cart....');
						return;
					}

					// Nothing to do here
				});
				*/
			});
		});
	});
};

handlers._orders.get = function (data, callback) {

	var token = helpers.validateUUID(data.headers.token);
	var user_uuid = helpers.validateUUID(data.headers.user_uuid);
	if (!token || !user_uuid) {
		callback(400, {'Erro': 'Missing fields'});
		return;
	}

	handlers._tokens.verifyToken(token, user_uuid, function(err) {
		if (err) {
			callback(403, {'Error': 'Invalid credentials'});
			return;
		}

		var order_uuid = helpers.validateUUID(data.path[1]);

		if (order_uuid) {
			_data.read('orders', order_uuid, function(err, orderData) {
				if (err) {
					callback(404, {'Error': 'Order is not avaiilable'});
					return;
				}
				if (orderData.user_uuid != user_uuid) {
					callback(403, {'Error': 'Permission denied to access this order'});
					return;
				}

				callback(200, [orderData]);
			});
			return;
		}


		_data.list('orders', function(err, orderUUIDs) {
			if (err) {
				callback(503, {'Error': 'Failed to retreive the list of orders'});
				return;
			}

			if (orderUUIDs.length == 0) {
				callback(200, []);
				return;
			}

			var idx = 0;
			var orders = [];
			var error = undefined;
			orderUUIDs.forEach(function(orderUUID) {
				_data.read('orders', orderUUID, function(err, orderData) {
					if (err) {
						error = err;
					}
					if (!error && orderData.user_uuid == user_uuid) {
						orders.push(orderData);
					}

					if (++idx == orderUUIDs.length) {
						if (!error) {
							callback(200, orders);
							return;
						}
						callback(503, {'Error': 'Error retreiving order recods'});
					}
				});
			});
		});
	});
};

handlers._orders.delete = function (data, callback) {
	if (data.path.length != 2 || data.path[0] != 'orders' || !helpers.validateUUID(data.path[1])) {
		callback(400, {'Error': 'Invalid URL specified'});
		return;
	}

	var token = helpers.validateUUID(data.headers.token);
	var user_uuid = helpers.validateUUID(data.headers.user_uuid);
	if (!token || !user_uuid) {
		callback(400, {'Erro': 'Missing fields'});
		return;
	}

	handlers._tokens.verifyToken(token, user_uuid, function(err) {
		if (err) {
			callback(403, {'Error': 'Invalid credentials'});
			return;
		}
		var order_uuid = data.path[1];
		_data.read('orders', order_uuid, function(err, orderData) {
			if (err) {
				callback(503, {'Error': 'Error checking the user\'s order'});
				return;
			}

			if (orderData.user_uuid != user_uuid) {
				callback(403, {'Error': 'The user does not have permisson to get the order'});
				return;
			}

			if (orderData.creation_date > Date.now() + 60 * 60) {
				callback(403, {'Error': 'An order can be deleted within one hour from from its creation time'});
				return;
			}

			_data.delete('orders', order_uuid, function(err) {
				if (err) {
					callback(503, {'Error': 'Failed to remove the order'});
					return;
				}
				callback(200, {uuid: order_uuid});
			});

		});
	});
};



module.exports = handlers;
