var cronJob = require('cron').CronJob,
	unirest = require('unirest'),
	jsonpath = require('json-path'),
	ObjectId = require('mongoose').Types.ObjectId,
	Customerio = require('node-customer.io');

/* Models */
var Job = require('../models/job');

var cio = new Customerio('202d0d8efc39e3364794', 'ff0f5ab843d2bde17df5');

var cronTab = function() {
  this.jobs = {};
};

cronTab.prototype.add = function(job) {
  if (this.jobs[job._id]) return false;
  try{
      var cron = new cronJob(job.expression, function() {
		  try{
          var req = unirest[job.method](job.url);
          if(job.headers!=null && job.headers.length>0 && !job.headers[0].header){
            req.headers(job.headers);
          }
            req.send((job.params!=null && job.params.length>0) ? job.params : {})
            .end(function (response) {
              Job.update({_id : new ObjectId(job._id)}, { $push: { 
                    responses: {
                            $each:[{date : new Date(), response : response.raw_body, statusCode : response.statusCode}], 
                            $slice: -20, //keep the last x responses
                            $sort: { date: -1 } 
                        }
                    } 
                }, {upsert:true},function(response){});
				
				//check for alarms
				checkAlarms(job,response);
				
              try{
                cio.track(job.user, 'runJob', {statusCode:response.statusCode}, function(err, res) {
                  if (err != null) {
                    console.log('ERROR', err);
                  }
                });
            }catch(e){}
              console.log('job complete:'+job._id);
            });
		  }catch(err){
			  console.log('error running job:-'+job._id);
			  this.jobs[job._id].stop();
  			  delete this.jobs[job._id];
		  }
      }, null, false);
      cron.start();
      this.jobs[job._id] = cron;
      return true;
  }catch(err){
    console.log('ERROR', 'job ' + job._id + ' : ' + err);
    return false;
  }
}

//Send any alarms based on the response
function checkAlarms(job,response){
	if(job.alarms && job.alarms.length>0){
		job.alarms.forEach(function(alarm){
			if(alarm.statusCode){
				if(response.statusCode!=alarm.statusCode){
					//if we need to send an alarm, exit out
					sendAlarm(job,response);
					return;
				}
			}

			if(alarm.jsonPath && alarm.jsonPathResult){
				try{
					var res = jpath.resolve(response.body, alarm.jsonPath);
					if(res != alarm.jsonPathResult){
						sendAlarm(job,response);
						return;
					}
				}catch(e){
					console.log('ERROR', e);
				}
			}
		});
	}
}

function sendAlarm(job,response){
	try{
		cio.track(job.user, 'alarm', {response : response.raw_body, statusCode : response.statusCode, url: job.url, expression: job.expression}, function(err, res) {
		  if (err != null) {
			console.log('ERROR', err);
		  }
		});
	}catch(e){}
}

cronTab.prototype.remove = function(job) {
  if (!this.jobs[job._id]) return false;
  this.jobs[job._id].stop();
  delete this.jobs[job._id];
  return true;
}

cronTab.prototype.update = function(job) {
  return this.remove(job) && this.add(job);
}

cronTab.prototype.togglePause = function(job) {
  if (!this.jobs[job._id]) return false;
  if (this.jobs[job._id].running) {
    this.jobs[job._id].stop();
  } else {
    this.jobs[job._id].start();
  }
  return true;
}

cronTab.prototype.removeAll = function() {
  var nbJobs = 0;
  for (id in this.jobs) {
    if (!this.remove(this.jobs[id])) return false;
    nbJobs++;
  }
  return nbJobs;
}

module.exports = new cronTab();