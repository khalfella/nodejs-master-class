/*
 * Mailgun API wrapper
 */

//Dependencies
var https = require('https');
var qs = require('querystring');
var config = require('../etc/config');


// mailgun container object
var mailgun = {};

mailgun.sendEmail = function(recepient, subject, body, callback) {

	var postData = qs.stringify({
		'from': config.mailgun.from,
                'to': recepient,
                'subject': subject,
                'text': body
        });

        var apiKey = config.mailgun.apiKey;
        var authHeader = 'Basic ' + Buffer.from(apiKey).toString('base64');

        var requestOptions = {
                'hostname': config.mailgun.hostname,
                'port': config.mailgun.port,
                'path': config.mailgun.path + '/messages',
                'method': 'POST',
                'headers': {
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'Content-Length': Buffer.byteLength(postData),
                        'Authorization': authHeader
                }
        };

        var req = https.request(requestOptions, function (res) {

                if (res.statusCode !== 200) {
                        callback('Request Failed: ' + res.statusCode);
                        res.resume();
                        return;
                }

                var rawData = '';
                res.on('data', function(chunk) {
                        rawData += chunk;
                });
                res.on('end', function() {
                        try {
                                var rep = JSON.parse(rawData);
                                callback(null, rep.id);
                        } catch(e) {
                                callback(e.message);
                        }
                });
        });

        req.on('error', function (err) {
                callback(err);
        });

        req.on('timeout', function(err) {
                req.abort();
                callback('Request timeed out');
        });

        req.end(postData);
};

// Export the container object
module.exports = mailgun;
