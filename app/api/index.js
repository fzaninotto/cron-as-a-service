/**
 * Module dependencies.
 */
var express    = require('express'),
	passport = require('passport'),
	LocalStrategy = require('passport-localapikey').Strategy,
	logger = require('morgan'),
	utils = require('../../lib/utils');

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

passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(user, done) {
  done(null, user);
});

app.use(passport.initialize());

app.all('*', function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header('Access-Control-Allow-Methods', 'GET, PUT, POST, DELETE, OPTIONS');
  res.header("Access-Control-Allow-Headers", "X-Requested-With, Content-Type, Accept");
  next();
 });


/**
 * @api {get} /jobs Get all Jobs for the authenticated user
 * @apiVersion 0.9.0
 * @apiName GetJobs
 * @apiGroup Jobs
 *
 * @apiParam {String} apikey Api Key.
 *
 * @apiSuccess {String} expression Cron Expression (Times are in UTC)
 * @apiSuccess {String} url  URL to request
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     [{
 *       "expression": "* * * * *",
 *       "lastname": "http://www.example.com"
 *     }]
 *
 * @apiError NotAuthenticatedError The apikey is incorrect or no apikey is provided
 *
 * @apiErrorExample Error-Response:
 *     HTTP/1.1 404 Not Found
 *     {
 *       "error": "You must provide a valid api key. Visit cronasaservice.com to register."
 *     }
 */
app.get('/jobs', ensureAuthenticated, function(req, res, next) {
  Job.find({user: req.user._id},function(err, jobs) {
    if (err) return next(err);
    res.json(jobs);
      
    try{
        utils.cio.track(req.user._id, 'getJobs', data, function(err, res) {
          if (err != null) {
            console.log('ERROR', err);
          }
        });
    }catch(e){}
  });
});

/**
 * @api {post} /jobs Create a new job
 * @apiVersion 0.9.0
 * @apiName CreateJob
 * @apiGroup Jobs
 *
 * @apiParam {String} apikey Api Key.
 * @apiParam {String} expression Cron expression (Times are in UTC).
 * @apiParam {String} url URL to request.
 *
 * @apiSuccess {String} expression Cron Expression
 * @apiSuccess {String} url  URL to request
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "expression": "* * * * *",
 *       "url": "http://www.example.com",
 *       "method": "get",
 *       "params": [{test:1}],
 *       "headers": [{X-Header:'111'}]
 *     }
 *
 * @apiError NotAuthenticatedError The apikey is incorrect or no apikey is provided
 *
 * @apiErrorExample Error-Response:
 *     HTTP/1.1 404 Not Found
 *     {
 *       "error": "You must provide a valid api key. Visit cronasaservice.com to register."
 *     }
 */
app.post('/jobs', ensureAuthenticated, function(req, res, next) {
  if (!req.body.expression || !req.body.url) return res.json({'error':'You must provide an expression and an url as POST parameters'});
  var job = new Job();
  job.expression = req.body.expression;
  job.url = req.body.url;
  job.user = req.user._id;
  job.method = req.body.method ? req.body.method : 'get';
  job.params = req.body.params!=null ? req.body.params : null;
  job.headers = req.body.headers!=null ? req.body.headers : null;
  job.save(function(err) {
    if (err) return next(err);
    if (CronTab.add(job)) {
      res.json(job);
        
    try{
        utils.cio.track(req.user._id, 'addJob', data, function(err, res) {
          if (err != null) {
            console.log('ERROR', err);
          }
        });
    }catch(e){}
    } else {
      return res.json({'error':'Error adding Job'});
    }
  });
});

/**
 * @api {get} /jobs Get a Job by id
 * @apiVersion 0.9.0
 * @apiName GetJob
 * @apiGroup Jobs
 *
 * @apiParam {String} apikey Api Key.
 * @apiParam {String} id ID for the job.
 *
 * @apiSuccess {String} expression Cron Expression (Times are in UTC)
 * @apiSuccess {String} url  URL to request
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "expression": "* * * * *",
 *       "lastname": "http://www.example.com"
 *     }
 *
 * @apiError NotAuthenticatedError The apikey is incorrect or no apikey is provided
 *
 * @apiErrorExample Error-Response:
 *     HTTP/1.1 404 Not Found
 *     {
 *       "error": "You must provide a valid api key. Visit cronasaservice.com to register."
 *     }
 */
app.get('/jobs/:id', ensureAuthenticated, function(req, res, next) {
  Job.findOne({ _id: req.params.id , user : req.user._id }, function(err, job) {
    if (err) return next(err);
	  
	if(job.user !== req.user._id){
		return res.json({'error':'This job does not belong to you'});
	}
    res.json(job);
      
    try{
        utils.cio.track(req.user._id, 'getJob', data, function(err, res) {
          if (err != null) {
            console.log('ERROR', err);
          }
        });
    }catch(e){}
  });
});

/**
 * @api {put} /jobs Edit an existing Job
 * @apiVersion 0.9.0
 * @apiName EditJob
 * @apiGroup Jobs
 *
 * @apiParam {String} apikey Api Key.
 * @apiParam {String} id ID for the job.
 * @apiParam {String} expression Cron expression.
 * @apiParam {String} url URL to request.
 *
 * @apiSuccess {String} expression Cron Expression (Times are in UTC)
 * @apiSuccess {String} url  URL to request
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "expression": "* * * * *",
 *       "url": "http://www.example.com"
 *     }
 *
 * @apiError NotAuthenticatedError The apikey is incorrect or no apikey is provided
 *
 * @apiErrorExample Error-Response:
 *     HTTP/1.1 404 Not Found
 *     {
 *       "error": "You must provide a valid api key. Visit cronasaservice.com to register."
 *     }
 */
app.put('/jobs/:id', ensureAuthenticated, function(req, res, next) {
  Job.findOne({ _id: req.params.id , user : req.user._id }, function(err, job) {
    if (err) return next(err);
    if (!job) return res.json({'error':'Trying to update non-existing job'});
    job.expression = req.params.expression;
    job.url = req.parms.url;
	job.user = req.user._id;
    job.method = req.body.method ? req.body.method : 'get';
    job.params = req.body.params;
    job.headers = req.body.headers;
    job.save(function(err2) {
      if (err2) return next(err2);
      if (CronTab.update(job)) {
        res.json(job);
          
    try{
        utils.cio.track(req.user._id, 'updateJob', data, function(err, res) {
          if (err != null) {
            console.log('ERROR', err);
          }
        });
    }catch(e){}
      } else {
        return res.json({'error':'Error updating Job'});
      }
    });
  });
});

/**
 * @api {delete} /jobs Delete a Job by id
 * @apiVersion 0.9.0
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
 *       "error": "You must provide a valid api key. Visit cronasaservice.com to register."
 *     }
 */
app.delete('/jobs/:id', ensureAuthenticated, function(req, res, next) {
  Job.findOne({ _id: req.params.id , user: req.user._id }, function(err, job) {
    if (err) return next(err);
    if (!job) return res.json({'error':'Trying to remove non-existing job'});
    job.remove(function(err2) {
      if (err2) return next(err2);
      if (CronTab.remove(job)) {
        res.json({'response':'deleted'});
          
        try{
        utils.cio.track(req.user._id, 'deleteJob', data, function(err, res) {
          if (err != null) {
            console.log('ERROR', err);
          }
        });
    }catch(e){}
      } else {
        return res.json({'error':'Error removing job'});
      }
    });
  });
});

/**
 * @api {get} / List possible API calls
 * @apiVersion 0.9.0
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
 *       "error": "You must provide a valid api key. Visit cronasaservice.com to register."
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
    
  try{
        utils.cio.track(req.user._id, 'getRoutes', data, function(err, res) {
          if (err != null) {
            console.log('ERROR', err);
          }
        });
    }catch(e){}
});

if (!module.parent) {
  app.listen(3000);
  console.log('Express started on port 3000');
}

function ensureAuthenticated(req, res, next) {
    passport.authenticate('localapikey', {session:false}, function(err, user, info) {
        if (err) { return next(err); }
        if (!user) { return res.json({'error':'You must provide a valid api key. Visit cronasaservice.com to register.'}); }
        req.logIn(user, function(err) {
          if (err) { return next(err); }
          return next();
        });
      })(req, res, next);
}