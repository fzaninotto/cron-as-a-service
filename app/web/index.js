/**
 * Module dependencies.
 */
var errorHandler = require('errorhandler');
var express      = require('express');
var http         = require('http');

var app = express();

// middleware

app.use(errorHandler({ dumpExceptions: true, showStack: true }));
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/public'));

app.get('/', function(req, res, next) {
  res.render('index', { route: app.route });
});

if (!module.parent) {
  var server = http.createServer(app)
  server.listen(app.get('port'), function () {
    console.log('Express server listening on port ' + app.get('port'))
  })
}

module.exports = app;