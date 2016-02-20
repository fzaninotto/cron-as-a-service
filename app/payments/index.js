/**
 * Module dependencies.
 */
var express    = require('express'),
	logger = require('morgan'),
	utils = require('../../lib/utils');

var app = module.exports = express();

var User     = require('../../models/user');

app.use(logger('dev'));


app.post('/stripe/webhook', function(req, res) {
    var event = JSON.parse(req.body);
    
    console.log(JSON.stringify(event))
    
    res.send(200);
});

if (!module.parent) {
  app.listen(3000);
  console.log('Express started on port 3000');
}