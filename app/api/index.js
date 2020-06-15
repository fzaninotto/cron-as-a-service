/**
 * Module dependencies.
 */
var errorHandler = require('errorhandler');
var express      = require('express');
var http         = require('http');

var Job = require('../../models/job');
var CronTab = require('../../lib/cronTab');

var app = express();

// middleware
app.use(errorHandler({ dumpExceptions: true, showStack: true }));

app.get('/jobs', function(req, res, next) {
  Job.find(function(err, jobs) {
    if (err) return next(err);
    res.json(jobs);
  });
});

app.post('/jobs', function(req, res, next) {
  if (!req.body.expression || !req.body.url) return next(new Error('You must provide an expression and an url as POST parameters'), 403);
  var job = new Job();
  job.expression = req.body.expression;
  job.url = req.body.url;
  job.save(function(err) {
    if (err) return next(err);
    if (CronTab.add(job)) {
      res.redirect('/jobs/' + job._id);
    } else {
      return next(new Error('Error adding Job'));
    }
  });
});

app.get('/jobs/:id', function(req, res, next) {
  Job.findOne({ _id: req.params.id }, function(err, job) {
    if (err) return next(err);
    res.json(job);
  });
});

app.put('/jobs/:id', function(req, res, next) {
  Job.findOne({ _id: req.params.id }, function(err, job) {
    if (err) return next(err);
    if (!job) return next(new Error('Trying to update non-existing job'), 403);
    job.expression = req.params.expression;
    job.url = req.parms.url;
    job.save(function(err2) {
      if (err2) return next(err2);
      if (CronTab.update(job)) {
        res.redirect('/jobs/' + job._id);
      } else {
        return next(new Error('Error updating Job'));
      }
    });
  });
});

app.delete('/jobs/:id', function(req, res, next) {
  Job.findOne({ _id: req.params.id }, function(err, job) {
    if (err) return next(err);
    if (!job) return next(new Error('Trying to remove non-existing job'), 403);
    job.remove(function(err2) {
      if (err2) return next(err2);
      if (CronTab.remove(job)) {
        res.redirect('/jobs');
      } else {
        return next(new Error('Error removing job'));
      }
    });
  });
});

// route list
app.get('/', function(req, res) {
  var routes = [];
  var url = req.protocol + '://' + req.get('host') + req.originalUrl;
  app._router.stack.forEach(layer => {
    if (typeof layer.route !== 'undefined') {
      var route = {
        method: Object.keys(layer.route.methods)[0].toUpperCase(),
        path: url + layer.route.path
      }
      routes.push(route);
    }
  });

  res.json(routes);
});

if (!module.parent) {
  var server = http.createServer(app)
  server.listen(app.get('port'), function () {
    console.log('Express server listening on port ' + app.get('port'))
  })
}

module.exports = app;