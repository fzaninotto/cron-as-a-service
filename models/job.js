var mongoose = require('mongoose');
var Schema   = mongoose.Schema;

// main model
var Job = new Schema({
  expression : String,
  url :        String,
  user:        String,
  method:      String,
  params:      {},
  headers:     {},
  responses:   []
});

Job.path('method').validate(function (value) {
    if(value===null){
        return true;
    }
    return /get|post/i.test(value);
}, 'Invalid HTTP method');

module.exports = mongoose.model('Job', Job);