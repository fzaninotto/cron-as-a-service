var mongoose = require('mongoose');
var Schema   = mongoose.Schema;

// main model
var Job = new Schema({
  expression : String,
  url :        String,
});

module.exports = mongoose.model('Job', Job);