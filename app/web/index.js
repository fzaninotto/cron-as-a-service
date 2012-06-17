/**
 * Module dependencies.
 */
var express    = require('express');
var app = module.exports = express.createServer();

// middleware

app.configure(function(){
  app.use(app.router);
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');
  app.use(express.static(__dirname + '/public'));
});

app.get('/', function(req, res, next) {
  res.render('index', { route: app.route });
});

if (!module.parent) {
  app.listen(3000);
  console.log('Express started on port 3000');
}