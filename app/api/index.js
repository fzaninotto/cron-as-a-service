/**
 * Module dependencies.
 */
var express    = require('express');
var app = module.exports = express.createServer();

var Job = require('../../models/job');
var CronTab = require('../../lib/cronTab');

// middleware

app.configure(function(){
  app.use(app.router);
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.get('/job', function(req, res, next) {
  Job.find(function(err, jobs) {
    if (err) return next(err);
    res.json(jobs);
  });
});

app.post('/job', function(req, res, next) {
  if (!req.body.expression || !req.body.url) return next(new Error('You must provide an expression and an url as POST parameters'), 403);
  var job = new Job();
  job.expression = req.body.expression;
  job.url = req.body.url;
  job.save(function(err) {
    if (err) return next(err);
    if (CronTab.add(job)) {
      res.redirect('/job/' + job._id);
    } else {
      return next(new Error('Error adding Job'));
    }
  });
});

app.get('/job/:id', function(req, res, next) {
  Job.findOne({ _id: req.params.id }, function(err, job) {
    if (err) return next(err);
    res.json(job);
  });
});

app.put('/job/:id', function(req, res, next) {
  Job.findOne({ _id: req.params.id }, function(err, job) {
    if (err) return next(err);
    if (!job) return next(new Error('Trying to update non-existing job'), 403);
    job.expression = req.params.expression;
    job.url = req.parms.url;
    job.save(function(err2) {
      if (err2) return next(err2);
      if (CronTab.update(job)) {
        res.redirect('/job/' + job._id);
      } else {
        return next(new Error('Error updating Job'));
      }
    });
  });
});

app.delete('/job/:id', function(req, res, next) {
  Job.findOne({ _id: req.params.id }, function(err, job) {
    if (err) return next(err);
    if (!job) return next(new Error('Trying to remove non-existing job'), 403);
    job.remove(function(err2) {
      if (err2) return next(err2);
      if (CronTab.remove(job)) {
        res.redirect('/job');
      } else {
        return next(new Error('Error removing job'));
      }
    });
  });
});

// route list
app.get('/', function(req, res) {
  var routes = [];
  app.routes.all().forEach(function(route) {
    routes.push({ method: route.method.toUpperCase() , path: app.route + route.path });
  });
  res.json(routes);
});

if (!module.parent) {
  app.listen(3000);
  console.log('Express started on port 3000');
}