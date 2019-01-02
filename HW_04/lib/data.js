/*
 * Library for storing and editing data
 */

// Dependancies
var fs = require('fs');
var path = require('path');
var helpers = require('./helpers');

// Container for this module (to be exported)
var lib = {};

// Base directory for the data folder
lib.baseDir = path.join(__dirname,'/../.data/');

lib.create = function (dir, file, data, callback) {

	// Open the file for writing
	var filePath = lib.baseDir + dir + '/' + file + '.json';
	fs.open(filePath, 'wx', function (err, fileDescriptor) {
		if (!err && fileDescriptor) {
			// Convert data to string
			var stringData = JSON.stringify(data);
			// Write to file and close it
			fs.writeFile(fileDescriptor, stringData, function(err) {
				if (!err) {
					fs.close(fileDescriptor, function(err) {
						if (!err) {
							callback(false);
						} else {
							callback('Error closing new file');
						}
			
					});
				} else {
					callback('Error writing to a new file');
				}
			});
		} else {
			callback('Could not create a new file, it may already exist');
		}
	});
};

// Read data from a file
lib.read = function (dir, file, callback) {
	fs.readFile(lib.baseDir + dir + '/' + file + '.json', 'utf-8', function (err, data) {
		if (!err && data) {
			var parsedData = helpers.parseJsonToObject(data);
			callback(false, parsedData);
			return;
		}

		callback(err, data);
	});
};


lib.update = function (dir, file, data, callback) {
	// Open the file for writing
	fs.open(lib.baseDir + dir + '/' + file + '.json', 'r+', function (err, fileDescriptor) {
		if (err || !fileDescriptor) {
			callback('Could not open the file for updating, it may not exist yet');
			return;
		}

		var stringData = JSON.stringify(data);
		fs.truncate(fileDescriptor, function (err) {
			if (err) {
				callback('Error truncating the file');
				return;
			}
			fs.writeFile(fileDescriptor, stringData, function (err) {
				if (err) {
					callback('Error writing to existing file');
					return;
				}

				fs.close(fileDescriptor, function(err) {
					if (err) {
						callback('Error closing the file');
						return;
					}


					callback(false);
				});
			});
		});
	});
};


// Delete a file
lib.delete = function (dir, file, callback) {
	fs.unlink(lib.baseDir + dir + '/' + file + '.json', function (err) {
		if (err) {
			callback('Trouble deleting the file');
			return;
		}
		callback(false);
	});
};


// List all the items in a directory
lib.list = function(dir, callback) {
	fs.readdir(lib.baseDir + dir + '/', function (err, data) {
		if (err) {
			callback(err, data);
			return;
		}

		var trimmedFileNames = data.map(function (fileName) {
			return fileName.replace('.json','');
		});
		callback(false, trimmedFileNames);
	});
};

// Export the module
module.exports = lib;
