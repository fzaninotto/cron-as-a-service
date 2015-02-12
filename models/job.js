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

Job.virtual('responseStatuses').get(function () {
    var statuses = [];
    for(var i in this.responses){
        if(this.responses[i] && this.responses[i].statusCode){
            statuses.push(this.responses[i].statusCode)
        }
    }
    return statuses;
});

Job.virtual('responseDates').get(function () {
    var statuses = [];
    for(var i in this.responses){
        if(this.responses[i] && this.responses[i].statusCode){
            statuses.push(this.responses[i].date.toUTCString());
        }
    }
    return statuses;
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