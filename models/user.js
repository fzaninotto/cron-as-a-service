var mongoose = require('mongoose');
var Schema   = mongoose.Schema;

// main model
var User = new Schema({
  apikey : String,
  created_at: { type: Date, default: Date.now },
  email :     { type: String, index: { unique: true }},
  name :      String,
  features : []
},{
  toObject: { getters: true }
});

module.exports = mongoose.model('User', User);