var mongoose = require('mongoose'),
    cronparser = require('cron-parser');
var Schema   = mongoose.Schema;

// main model
var Job = new Schema({
  expression : String,
  url :        String,
  user:        { type: String, index: true },
  method:      String,
  params:      {},
  headers:     {},
  responses:   []
},{
    toObject: {
      virtuals: true
    }
    ,toJSON: {
      virtuals: true
    }
});

Job.virtual('nextRun').get(function () {
    try {
      var interval = cronparser.parseExpression(this.expression);
      return interval.next();    
    } catch (err) {
      console.log('Error getting next run: ' + err.message);
    }
});

Job.path('method').validate(function (value) {
    if(value===null){
        return true;
    }
    return /get|post/i.test(value);
}, 'Invalid HTTP method');

Job.path('expression').validate(function (expression) {
    try {
      cronparser.parseExpression(expression);
    } catch (err) {
      return false;
    }
    return true;
},'Invalid CRON syntax');

module.exports = mongoose.model('Job', Job);