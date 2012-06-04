/*
 * Monitor remote server uptime.
 */

var http = require('http');

http.createServer(function(req, res) {
  console.log('%s: received call to %s', new Date(), req.url);
  res.end();
}).listen(8888);