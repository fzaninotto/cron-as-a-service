var mongoose = require('mongoose');
var Schema   = mongoose.Schema;

// main model
var User = new Schema({
  apikey : String,
  email :        String,
  name :        String,
});

module.exports = mongoose.model('User', User);