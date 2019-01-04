

// The main container object
var app = {};

// Tests container object
app.tests = {};

app.tests.unit = require('./unit');		// Unit tests



var countUnitTests = Object.keys(app.tests.unit).reduce(function(acc, key) {
	if (app.tests.unit.hasOwnProperty(key)) {
			acc++;
	}
	return acc;
}, 0);

app.runTests = function() {
	var errors = [];
	var successes = 0;
	var limit = countUnitTests;
	var counter = 0;


	// Run the unit tests
	for (var key in app.tests.unit) {
		if (app.tests.unit.hasOwnProperty(key)) {


			// Wrap the tests in a self-invoking function
			(function () {
				unitTest = app.tests.unit[key];

				try {
					unitTest(function() {
						// If we are here, it means the test has succeeded.
						console.log('\x1b[32m%s\x1b[0m',key);
						counter++;
						successes++;
						if (counter == limit) {
							app.produceTestReport(limit, successes, errors);
						}
					});
				} catch (e) {
					// If we are here, it means the test has failed.
					errors.push({
					    'name': key,
					    'error': e
					});
					counter++;

					console.log('\x1b[31m%s\x1b[0m',key);
					if (counter == limit) {
						app.produceTestReport(limit, successes, errors);
					}
				}

			})();
		}
	}
}

app.produceTestReport = function(limit,successes,errors){
  console.log("");
  console.log("--------BEGIN TEST REPORT--------");
  console.log("");
  console.log("Total Tests: ",limit);
  console.log("Pass: ",successes);
  console.log("Fail: ",errors.length);
  console.log("");

  // If there are errors, print them in detail

  if(errors.length > 0){
    console.log("--------BEGIN ERROR DETAILS--------");
    console.log("");
    errors.forEach(function(testError){
      console.log('\x1b[31m%s\x1b[0m',testError.name);
      console.log(testError.error);
      console.log("");
    });
    console.log("");
    console.log("--------END ERROR DETAILS--------");
  }
  console.log("");
  console.log("--------END TEST REPORT--------");
  process.exit(0);

};

app.runTests();
