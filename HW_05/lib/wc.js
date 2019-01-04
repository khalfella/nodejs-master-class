/*
 * A simple character/word/line counter. This should work like UNIX wc(1) command
 */


// A container object
var wc = {};

wc.createCounter = function () {

	var characters = 0;
	var words = 0;
	var lines = 0;

	return {
		'write': function(data) {
			characters += data.length;
			words += data.split(/\ |\n|\t/).filter(function(w) { return w !== '';}).length;
			lines += data.split('\n').length - 1;
		},
		'read' : function () {
			return [lines, words, characters];
		}
	};
};


// Export the container object
module.exports = wc;
