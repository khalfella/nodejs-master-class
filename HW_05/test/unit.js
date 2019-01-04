/*
 * Unit tests for 'wc' module
 */

// Dependancies
var wc = require('./../lib/wc');
var assert = require('assert');

// Unit test container object
var unit = {};

unit['Simple test one word or character'] = function(done) {
	var counter = wc.createCounter();
	counter.write('1');
	var output = counter.read();
	assert.deepEqual(output, [0,1,1]);
	done();
};

unit['Two words in zero line'] = function(done) {
	var counter = wc.createCounter();
	counter.write('one two');
	assert.deepEqual(counter.read(), [0, 2, 7]);
	done();
};

unit['Two words in zero line - two batches'] = function(done) {
	var counter = wc.createCounter();
	counter.write('one '); counter.write('two');
	assert.deepEqual(counter.read(), [0, 2, 7]);
	done();
};

// Export unit tests container object
module.exports = unit;
