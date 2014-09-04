/**
 * Module dependencies.
 */
var express    = require('express'),
	passport = require('passport'),
	LocalStrategy = require('passport-localapikey').Strategy,
	logger = require('morgan');

var app = module.exports = express();

var Job = require('../../models/job'),
	User     = require('../../models/user');
var CronTab = require('../../lib/cronTab');

app.use(logger('dev'));

// middleware

passport.use(new LocalStrategy(
  function(apikey, done) {
    User.findOne({ apikey: apikey }, function (err, user) {
      if (err) { return done(err); }
      if (!user) { return done(null, false); }
      return done(null, user);
    });
  }
));

app.use(passport.initialize());


app.get('/jobs', ensureAuthenticated, function(req, res, next) {
  Job.find({user: req.user.id},function(err, jobs) {
    if (err) return next(err);
    res.json(jobs);
  });
});

app.post('/jobs', ensureAuthenticated, function(req, res, next) {
  if (!req.body.expression || !req.body.url) return next(new Error('You must provide an expression and an url as POST parameters'), 403);
  var job = new Job();
  job.expression = req.body.expression;
  job.url = req.body.url;
  job.user = req.user.id;
  job.save(function(err) {
    if (err) return next(err);
    if (CronTab.add(job)) {
      res.redirect('/jobs/' + job._id);
    } else {
      return next(new Error('Error adding Job'));
    }
  });
});

app.get('/jobs/:id', ensureAuthenticated, function(req, res, next) {
  Job.findOne({ _id: req.params.id }, function(err, job) {
    if (err) return next(err);
    res.json(job);
  });
});

app.put('/jobs/:id', ensureAuthenticated, function(req, res, next) {
  Job.findOne({ _id: req.params.id }, function(err, job) {
    if (err) return next(err);
    if (!job) return next(new Error('Trying to update non-existing job'), 403);
    job.expression = req.params.expression;
    job.url = req.parms.url;
	job.user = req.user.id;
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

app.delete('/jobs/:id', ensureAuthenticated, function(req, res, next) {
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
app.get('/', ensureAuthenticated, function(req, res) {
  var routes = [];
  app._router.stack.forEach(function(stackRoute) {
	  if(stackRoute.route){
		  routes.push({ method: stackRoute.route.methods , path: app.route + stackRoute.route.path });
	  }
  });
  res.json(routes);
});

if (!module.parent) {
  app.listen(3000);
  console.log('Express started on port 3000');
}

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) { return next(); }
  res.json({error:'You must provide a valid api key. Visit crontabasaservice.com to register.'});
}