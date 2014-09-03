/**
 * Module dependencies.
 */
var express = require('express'),
	partials = require('express-partials')
	logger = require('morgan');

var app = module.exports = express();

app.use(logger('dev'));

// load the express-partials middleware
app.use(partials());

// middleware

app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');
  app.use(express.static(__dirname + '/public'));

app.get('/', function(req, res, next) {
  res.render('index', { route: app.route });
});

if (!module.parent) {
  app.listen(3000);
  console.log('Express started on port 3000');
}