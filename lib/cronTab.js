var cronJob = require('cron').CronJob,
	unirest = require('unirest'),
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
          var req = unirest[job.method](job.url);
          if(job.headers!=null && job.headers.length>0){
            req.headers(job.headers);
          }
            req.send((job.params!=null && job.params.length>0) ? job.params : {})
            .end(function (response) {
              Job.update({_id : new ObjectId(job._id)}, { $push: { 
                    responses: {
                            $each:[{date : new Date(), response : JSON.stringify(response), responseCode : response.statusCode}], 
                            $slice: -20, //keep the last x responses
                            $sort: { date: -1 } 
                        }
                    } 
                }, {upsert:true},function(response){});
              try{
                cio.track(job.user, 'runJob', {statusCode:response.statusCode}, function(err, res) {
                  if (err != null) {
                    console.log('ERROR', err);
                  }
                });
            }catch(e){}
              console.log('job complete:'+job._id);
            });
      }, null, false);
      cron.start();
      this.jobs[job._id] = cron;
      return true;
  }catch(err){
    console.log('ERROR', 'job ' + job._id + ' : ' + err);
    return false;
  }
}

cronTab.prototype.remove = function(job) {
  if (!this.jobs[job._id]) return false;
  this.jobs[job._id].stop();
  delete this.jobs[job._id];
  return true;
}

cronTab.prototype.update = function(job) {
  return this.removeJob(job) && this.addJob(job);
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