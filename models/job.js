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
  requestBody: String,
  responseEmail:String,
  headers:     {},
  responses:   [],
  alarms:      [{
                    statusCode: Number,
                    jsonPath: String,
	  				jsonPathResult: String
                }]
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

Job.path('alarms').validate(function (value) {
    if(value==null){
		return true;
	}
    for(var i=0; i<value.length; i++){
		var alarm =  value[i];
		//must have at least 1 of status code and jsonPath
		if(alarm.statusCode==null && alarm.jsonPath==null){
			return false;
		}
		
		if(alarm.jsonPath!=null && alarm.jsonPathResult==null){
			return false;
		}
		
		if(alarm.jsonPath==null && alarm.jsonPathResult!=null){
			return false;
		}
	}
	return true;
}, 'Invalid alarm');

module.exports = mongoose.model('Job', Job);