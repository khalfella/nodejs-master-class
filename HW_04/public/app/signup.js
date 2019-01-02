
var app =  {};



app.init = function () {
	var loginForm = document.getElementById('signupForm');
	loginForm.addEventListener('submit', function (e) {
		// Stop the form from submitting
		e.preventDefault();
		var userName = document.getElementById('userName').value;
		var firstName = document.getElementById('firstName').value;
		var lastName = document.getElementById('lastName').value;
		var password = document.getElementById('password').value;
		var email = document.getElementById('email').value;
		var address = document.getElementById('address').value;

		var payload = {
			'userName': userName,
			'firstName': firstName,
			'lastName': lastName,
			'password': password,
			'email': email,
			'address': address
		};


		console.log(payload);

		var xhr = new XMLHttpRequest();
		xhr.open('POST', '/users', true);
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
				window.location = '/';
			} catch (e) {
				console.log('Invalid response from the server');
			}

		};

		xhr.send(JSON.stringify(payload));

	});
	
};

window.onload = function () {
	app.init();
};
