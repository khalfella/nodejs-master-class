/*
 * Create an export configuration variables
 */

// Container for all the environment.
var environments = {};

// Staging (default) environment
environments.staging = {
	'httpPort' : 3000,
	'httpsPort' : 3001,
	'envName' : 'staging',
	'hashingSecrete' : 'thisIsASecrete',
	'stripe' : {
		'apiKey' : 'sk_test_4eC39HqLyjWDarjtT1zdp7dc',
		'hostname' : 'api.stripe.com',
		'port' : 443
	},
	'mailgun' : {
		'from' : 'postmaster@sandbox945245a3c1bc482197b6cdcc3e186ed9.mailgun.org',
		'apiKey' : 'api:2246247d29dc3c06964568bdb281730d-41a2adb4-cd2b6d4c',
		'hostname' : 'api.mailgun.net',
		'path' : '/v3/sandbox945245a3c1bc482197b6cdcc3e186ed9.mailgun.org',
		'port' : 443
	}
};


// Production environment
environments.production = {
	'httpPort' : 5000,
	'httpsPort' : 5001,
	'envName' : 'production',
	'hashingSecrete' : 'thisIsAlsoASecrete',
	'stripe' : {
		'apiKey' : 'sk_test_4eC39HqLyjWDarjtT1zdp7dc',
		'hostname' : 'api.stripe.com',
		'port' : 443
	},
	'mailgun' : {
		'from' : 'postmaster@sandbox945245a3c1bc482197b6cdcc3e186ed9.mailgun.org',
		'apiKey' : 'api:2246247d29dc3c06964568bdb281730d-41a2adb4-cd2b6d4c',
		'hostname' : 'api.mailgun.net',
		'path' : '/v3/sandbox945245a3c1bc482197b6cdcc3e186ed9.mailgun.org',
		'port' : 443
	}
};

// Determine which environment was passed as a command-line argument.
var currentEnvironment = typeof(process.env.NODE_ENV) == 'string' ? process.env.NODE_ENV.toLowerCase() : '';

// Check the current environment is one of the environments above. If not, default to staging.
var environmentToExport = typeof(environments[currentEnvironment]) == 'object' ? environments[currentEnvironment] : environments.staging;

// Export the module
module.exports = environmentToExport;
