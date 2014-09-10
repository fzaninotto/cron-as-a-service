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


/**
 * @api {get} /jobs Get all Jobs for the authenticated user
 * @apiName GetJobs
 * @apiGroup Jobs
 *
 * @apiParam {String} apikey Api Key.
 *
 * @apiSuccess {String} expression Cron Expression
 * @apiSuccess {String} url  URL to request
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     [{
 *       "expression": "* * * *",
 *       "lastname": "http://www.example.com"
 *     }]
 *
 * @apiError NotAuthenticatedError The apikey is incorrect or no apikey is provided
 *
 * @apiErrorExample Error-Response:
 *     HTTP/1.1 404 Not Found
 *     {
 *       "error": "You must provide a valid api key. Visit crontabasaservice.com to register."
 *     }
 */
app.get('/jobs', ensureAuthenticated, function(req, res, next) {
  Job.find({user: req.user.id},function(err, jobs) {
    if (err) return next(err);
    res.json(jobs);
  });
});

/**
 * @api {post} /jobs Create a new job
 * @apiName CreateJob
 * @apiGroup Jobs
 *
 * @apiParam {String} apikey Api Key.
 * @apiParam {String} expression Cron expression.
 * @apiParam {String} url URL to request.
 *
 * @apiSuccess {String} expression Cron Expression
 * @apiSuccess {String} url  URL to request
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "expression": "* * * *",
 *       "lastname": "http://www.example.com"
 *     }
 *
 * @apiError NotAuthenticatedError The apikey is incorrect or no apikey is provided
 *
 * @apiErrorExample Error-Response:
 *     HTTP/1.1 404 Not Found
 *     {
 *       "error": "You must provide a valid api key. Visit crontabasaservice.com to register."
 *     }
 */
app.post('/jobs', ensureAuthenticated, function(req, res, next) {
  if (!req.body.expression || !req.body.url) return next(new Error('You must provide an expression and an url as POST parameters'), 403);
  var job = new Job();
  job.expression = req.body.expression;
  job.url = req.body.url;
  job.user = req.user.id;
  job.save(function(err) {
    if (err) return next(err);
    if (CronTab.add(job)) {
      res.json(job);
    } else {
      return next(new Error('Error adding Job'));
    }
  });
});

/**
 * @api {get} /jobs Get a Job by id
 * @apiName GetJob
 * @apiGroup Jobs
 *
 * @apiParam {String} apikey Api Key.
 * @apiParam {String} id ID for the job.
 *
 * @apiSuccess {String} expression Cron Expression
 * @apiSuccess {String} url  URL to request
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "expression": "* * * *",
 *       "lastname": "http://www.example.com"
 *     }
 *
 * @apiError NotAuthenticatedError The apikey is incorrect or no apikey is provided
 *
 * @apiErrorExample Error-Response:
 *     HTTP/1.1 404 Not Found
 *     {
 *       "error": "You must provide a valid api key. Visit crontabasaservice.com to register."
 *     }
 */
app.get('/jobs/:id', ensureAuthenticated, function(req, res, next) {
  Job.findOne({ _id: req.params.id }, function(err, job) {
    if (err) return next(err);
	  
	if(job.user !== req.user.id){
		return next(new Error('This job does not belong to you'), 403);
	}
    res.json(job);
  });
});

/**
 * @api {put} /jobs Edit an existing Job
 * @apiName EditJob
 * @apiGroup Jobs
 *
 * @apiParam {String} apikey Api Key.
 * @apiParam {String} id ID for the job.
 * @apiParam {String} expression Cron expression.
 * @apiParam {String} url URL to request.
 *
 * @apiSuccess {String} expression Cron Expression
 * @apiSuccess {String} url  URL to request
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "expression": "* * * *",
 *       "lastname": "http://www.example.com"
 *     }
 *
 * @apiError NotAuthenticatedError The apikey is incorrect or no apikey is provided
 *
 * @apiErrorExample Error-Response:
 *     HTTP/1.1 404 Not Found
 *     {
 *       "error": "You must provide a valid api key. Visit crontabasaservice.com to register."
 *     }
 */
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
        res.json(job);
      } else {
        return next(new Error('Error updating Job'));
      }
    });
  });
});

/**
 * @api {delete} /jobs Delete a Job by id
 * @apiName DeleteJob
 * @apiGroup Jobs
 *
 * @apiParam {String} apikey Api Key.
 * @apiParam {String} id ID for the job.
 *
 * @apiSuccess {String} response Response message
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "response": "deleted"
 *     }
 *
 * @apiError NotAuthenticatedError The apikey is incorrect or no apikey is provided
 *
 * @apiErrorExample Error-Response:
 *     HTTP/1.1 404 Not Found
 *     {
 *       "error": "You must provide a valid api key. Visit crontabasaservice.com to register."
 *     }
 */
app.delete('/jobs/:id', ensureAuthenticated, function(req, res, next) {
  Job.findOne({ _id: req.params.id }, function(err, job) {
    if (err) return next(err);
    if (!job) return next(new Error('Trying to remove non-existing job'), 403);
    job.remove(function(err2) {
      if (err2) return next(err2);
      if (CronTab.remove(job)) {
        res.json({'response':'deleted'});
      } else {
        return next(new Error('Error removing job'));
      }
    });
  });
});

/**
 * @api {get} / List possible API calls
 * @apiName ListCalls
 * @apiGroup Api
 *
 * @apiParam {String} apikey Api Key.
 *
 * @apiSuccess {String} method Http method for this api call
 * @apiSuccess {String} path  URL to call this api
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     [{
 *       "method": "get",
 *       "path": "/jobs"
 *     }]
 *
 * @apiError NotAuthenticatedError The apikey is incorrect or no apikey is provided
 *
 * @apiErrorExample Error-Response:
 *     HTTP/1.1 404 Not Found
 *     {
 *       "error": "You must provide a valid api key. Visit crontabasaservice.com to register."
 *     }
 */
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
  return next(new Error('You must provide a valid api key. Visit crontabasaservice.com to register.'), 403);
}