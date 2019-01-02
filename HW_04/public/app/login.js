

var app =  {};

function createCart(token) {
	var xhr = new XMLHttpRequest();
	xhr.open('POST', '/carts', true);
	xhr.setRequestHeader('token', token.uuid);
	xhr.setRequestHeader('user_uuid', token.user_uuid);
	xhr.onreadystatechange = function () {
		if (xhr.readyState != XMLHttpRequest.DONE) {
			return;
		}

		if (xhr.status != 201) {
			console.log('status code is not 201');
			return;
		}

		try {
			var cart = JSON.parse(xhr.responseText);
			localStorage.setItem('cart_uuid', cart.uuid);
			window.location = '/order';
		} catch (e) {
			console.log('Invalid response from the server');
		}
	};
	xhr.send();
}


app.init = function () {
	var loginForm = document.getElementById('loginForm');
	loginForm.addEventListener('submit', function (e) {
		// Stop the form from submitting
		e.preventDefault();
		var userName = document.getElementById('userName').value;
		var password = document.getElementById('password').value;

		var xhr = new XMLHttpRequest();
		xhr.open('POST', '/tokens', true);
		xhr.setRequestHeader('username', userName);
		xhr.setRequestHeader('password', password);
		xhr.onreadystatechange = function () {
			if (xhr.readyState != XMLHttpRequest.DONE) {
				return;
			}

			if (xhr.status != 201) {
				console.log('status code is not 201');
				return;
			}

		
			try {
				var token = JSON.parse(xhr.responseText);
				localStorage.setItem('token', xhr.responseText);
				createCart(token);
			} catch (e) {
				console.log('Invalid response from the server');
			}

		};

		xhr.send();

	});
	
};

window.onload = function () {
	app.init();
};
