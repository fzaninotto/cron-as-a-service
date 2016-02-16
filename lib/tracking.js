var request = require('request');
var querystring = require('querystring');

//send a tracking event to the tracking url
module.exports.track = function(opts){
    if(!process.env.TRACK_URL) return;//exit out if no tracking url is defined
    
    request(process.env.TRACK_URL + '/event?' + querystring.stringify(opts));
}