var mongoose = require('mongoose');
var Schema   = mongoose.Schema;

// main model
var Job = new Schema({
  expression : String,
  url :        String,
  user:        String,
  method:      String,
  params:      [],
  headers:     []
});

Job.path('method').validate(function (value) {
  return /get,post/i.test(value);
}, 'Invalid HTTP method');

module.exports = mongoose.model('Job', Job);