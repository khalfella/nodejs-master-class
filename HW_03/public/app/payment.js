
var app =  {};

function postPayment(token_id, charge_id, callback) {
	var payload = {
		'cart_uuid': app.cart.uuid,
		'stripe_token_id': token_id,
		'stripe_charge_id': charge_id,
	};

	var xhr = new XMLHttpRequest();
	xhr.open('POST', '/pay', true);
	xhr.setRequestHeader('user_uuid', app.token.user_uuid);
	xhr.setRequestHeader('token', app.token.uuid);
	xhr.setRequestHeader('Content-Type','application/json');
        xhr.onreadystatechange = function () {
		if (xhr.readyState != XMLHttpRequest.DONE) {
			return;
		}

		if (xhr.status != 200) {
			callback('Failed to post the payment');
			return;
		}

		callback(null);
	};

	xhr.send(JSON.stringify(payload));
};

function creatCreditCardToken(creditCardNumber, expMonth, expYear, cvc, callback) {
	var fd = ['card[number]=' +  creditCardNumber,
	    'card[exp_month]=' + Number(expMonth),
	    'card[exp_year]=' + Number(expYear),
	    'card[cvc]=' + Number(cvc)
	];

	var apiKey = 'sk_test_4eC39HqLyjWDarjtT1zdp7dc';
	var authHeader = "Bearer " + apiKey; //btoa(apiKey);

	var xhr = new XMLHttpRequest();
	xhr.open('POST', 'https://api.stripe.com/v1/tokens', true);
	xhr.setRequestHeader('Authorization', authHeader);
	xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
	xhr.onreadystatechange = function () {
		if (xhr.readyState != XMLHttpRequest.DONE) {
			return;
		}

		if (xhr.status != 200) {
			callback('Failed to POST to stripe', null);
			return;
		}

		var token = null;
		try {
			token = JSON.parse(xhr.responseText);
		} catch(e) {
			callback('Invalid input from JSON');
			return;
		}

		callback(null, token);
		
	};

	xhr.send(fd.join('&'));
}

function createCreditCardCharge(amount, currency, token, description, callback) {
	var fd = ['amount=' +  amount,
	    'currency=' + currency,
	    'source=' + token,
	    'description=' + description,
	    'capture=false'
	];

	var apiKey = 'sk_test_4eC39HqLyjWDarjtT1zdp7dc';
	var authHeader = "Bearer " + apiKey;
	var xhr = new XMLHttpRequest();
	xhr.open('POST', 'https://api.stripe.com/v1/charges', true);
	xhr.setRequestHeader('Authorization', authHeader);
	xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
	xhr.onreadystatechange = function () {
		if (xhr.readyState != XMLHttpRequest.DONE) {
			return;
		}
		if (xhr.status != 200) {
			callback('Failed to POST to stripe', null);
			return;
		}

		var charge = null;
		try {
			charge = JSON.parse(xhr.responseText);
		} catch(e) {
			callback('Invalid input from stripe');
			return;
		}

		callback(null, charge);
	};
	xhr.send(fd.join('&'));
}

function getCart(cart_uuid, callback) {
	var xhr = new XMLHttpRequest();
        xhr.open('GET', '/carts', true);
	xhr.setRequestHeader('user_uuid', app.token.user_uuid);
	xhr.setRequestHeader('token', app.token.uuid);
        xhr.onreadystatechange = function () {
		if (xhr.readyState != XMLHttpRequest.DONE) {
			return;
		}

		if (xhr.status != 200) {
			callback('Failed to check the cart', null);
			return;
		}

		var cart = null;
		try {
			cart = JSON.parse(xhr.responseText);
		} catch (e) {
			callback('Invalid cart', null);
			return;
		}

		app.cart = cart;
		var amount = document.getElementById('message');
		amount.innerHTML = 'Total amount $' + cart.total_price;
		callback(null, cart);
	};
	xhr.send();
}


function checkToken(token, callback) {

	var xhr = new XMLHttpRequest();
	xhr.open('GET', '/tokens/' + token.uuid, true);
	xhr.onreadystatechange = function () {
		if (xhr.readyState != XMLHttpRequest.DONE) {
			return;
		}

		if (xhr.status != 200) {
			callback('Failed to check the token');
			return;
		}

		var tkn = null;
		try {
			tkn = JSON.parse(xhr.responseText);
		} catch (e) {
			callback('Invalid token');
			return;
		}

		if (!tkn.expiration || tkn.expiration <= Date.now()) {
			callback('Expired token');
			return;
		}

		app.token = token;
		callback(null);

	};
	xhr.send();

}

app.init = function () {

	var token = localStorage.getItem('token');
	var cart_uuid = localStorage.getItem('cart_uuid');

	if (!token || !cart_uuid) {
		window.location = '/';
		return;
	};

	var t = null;
	try {
		t = JSON.parse(token);
	} catch (e) {
		window.location = '/';
		return;
	}

	checkToken(t, function (err) {
		if (err) {
			window.location = '/';
			return;
		}

		getCart(cart_uuid, function(err, cart) {
			if (err) {
				console.log('Failed to get the cart');
				window.location = '/';
				return;
			}
		});
	});

	var loginForm = document.getElementById('paymentForm');
	loginForm.addEventListener('submit', function (e) {
		// Stop the form from submitting
		e.preventDefault();



		var ccn = document.getElementById('creditCartNumber').value;
		var expMonth = document.getElementById('expMonth').value;
		var expYear = document.getElementById('expYear').value;
		var cvc = document.getElementById('CVC').value;

		creatCreditCardToken(ccn, expMonth, expYear, cvc, function (err, token) {
			if (err) {
				console.log('Failed to create a token');
				return;
			}

			createCreditCardCharge(app.cart.total_price, 'usd', token.id, app.cart.uuid, function (err, charge) {
				if (err) {
					console.log('Error creating the charge');
					return;
				}

				postPayment(token.id, charge.id, function (err) {
					if (err) {
						console.log('Failed to post the payment');
						return;
					}

					// Done with the payment
					window.location = '/';
				});
			});

		});

		return;
	});
	
};

window.onload = function () {
	app.init();
};
