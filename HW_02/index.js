/*
 * Primary file for the API
 */


// Dependancies
var server = require('./lib/server');
//var workers = require('./lib/workers');

// Declare the app
app = {};


// Init functin 
app.init = function () {
	server.init();
	//workers.init();
};

// Execute that function
app.init();

// Export the app
module.exports = app;
