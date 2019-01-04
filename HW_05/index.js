/*
 * A small program that reads data from stdin and pirnts
 * the number of characters, letters and new lines.
 */

var wc = require('./lib/wc');

var counter = wc.createCounter();

process.stdin.on('data', function(data) {
	counter.write(data.toString());
});

process.stdin.on('end', function() {
	console.log(counter.read());
});
