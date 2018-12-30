
var app =  {};

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
		callback(null, cart);
	};
	xhr.send();
	callback
}


function cartToTable(cart, orderTable) {
	var rows = 6;

	console.log(cart);

	app.items.forEach(function (item) {
		var tr = document.createElement('tr');

		var tdItem = document.createElement('td');
		var tdDesc = document.createElement('td');
		var tdUUID = document.createElement('td');

		var tdQuantity = document.createElement('td');
		var qty = document.createElement('input');
		qty.setAttribute("type", "number");
		qty.setAttribute("min", 0);
		qty.setAttribute("step", 1);
		qty.setAttribute("id", item.uuid);
		tdQuantity.appendChild(qty);
		
		var tdPrice = document.createElement('td');
		var tdTotalPrice = document.createElement('td');

		tdItem.innerHTML = 'XXX';
		tdDesc.innerHTML = item.description;
		tdUUID.innerHTML = item.uuid;

		// Try to find the element in the cart
		var q = 0;
		cart.items.forEach(function(ci) {
			if (ci.uuid == item.uuid) {
				q = ci.quantity;
			}
		});
		qty.value = q;

		tdPrice.innerHTML = item.price;
		tdTotalPrice.innerHTML = item.price * qty.value ;


		qty.addEventListener('change', function () {
			tdTotalPrice.innerHTML = item.price * qty.value;
		});


		tr.appendChild(tdItem);
		tr.appendChild(tdDesc);
		tr.appendChild(tdUUID);
		tr.appendChild(tdQuantity);
		tr.appendChild(tdPrice);
		tr.appendChild(tdTotalPrice);

		orderTable.appendChild(tr);
	});
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

		var xhr2 = new XMLHttpRequest();
		xhr2.open('GET', '/items', true);
		xhr2.setRequestHeader('user_uuid', app.token.user_uuid);
		xhr2.setRequestHeader('token', app.token.uuid);
		xhr2.onreadystatechange = function () {
			if (xhr2.readyState != XMLHttpRequest.DONE) {
				return;
			}

			if (xhr2.status != 200) {
				callback('Failed to retreive list of items');
				return;
			}

			var items = null;
			try {
				items = JSON.parse(xhr2.responseText);
			} catch (e) {
				callback('Invalid list of items');
				return;
			}

			app.items = items;
			callback(null);
		};

		xhr2.send();

	};
	xhr.send();

}

function updateTheOrder(cb) {
	var oitems = [];
	app.items.forEach(function(item) {
		var qty = document.getElementById(item.uuid);
		oitems.push( {
			'uuid': item.uuid,
			'quantity': Number(qty.value)
		});
	});

	var xhr = new XMLHttpRequest();
	xhr.open('PUT', '/carts/' + app.cart.uuid, true);
	xhr.setRequestHeader('user_uuid', app.token.user_uuid);
	xhr.setRequestHeader('token', app.token.uuid);
	xhr.onreadystatechange = function () {
		if (xhr.readyState != XMLHttpRequest.DONE) {
			return;
		}

		if (xhr.status != 201) {
			cb('Failed to update the cart');
			return;
		}

		var cart = null;
		try {
			cart = JSON.parse(xhr.responseText);
		} catch (e) {
			cb('Invalid input...');
			return;
		}

		app.cart = cart;
		cb(null);
	};

	xhr.send(JSON.stringify(oitems));
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
			var orderTable = document.getElementById('orderTable');
			cartToTable(cart, orderTable);
		});
	});

	var loginForm = document.getElementById('orderForm');
	loginForm.addEventListener('submit', function (e) {
		// Stop the form from submitting
		e.preventDefault();
		updateTheOrder(function(err) {
			if (err) {
				console.log('Failed to update the order');
				return;
			}

			console.log('updated');
			window.location = '/payment';
		})
	});
	
};

window.onload = function () {
	app.init();
};
