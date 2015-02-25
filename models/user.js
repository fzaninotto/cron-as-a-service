var mongoose = require('mongoose');
var Schema   = mongoose.Schema;

// main model
var User = new Schema({
  apikey : String,
  created_at: { type: Date, default: Date.now },
  email :     { type: String, index: { unique: true }},
  name :      String,
  features :  [],
  attr :      [{ name : String, value : String }],
  stripe: {
      customerId: String,
      token: String,
      plan: {
        type: String,
        default: 'free'
      }
    }
},{
  toObject: { getters: true }
});


module.exports = mongoose.model('User', User);