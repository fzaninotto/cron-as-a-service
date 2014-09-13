/**
 * Module dependencies.
 */
var express    = require('express'),
    session = require('express-session')
	passport = require('passport'),
	LocalStrategy = require('passport-localapikey').Strategy,
	logger = require('morgan'),
    crypto = require('crypto'),
	Customerio = require('node-customer.io');

var app = module.exports = express();

var Job = require('../../models/job'),
	User     = require('../../models/user');
var CronTab = require('../../lib/cronTab');

app.use(logger('dev'));

var cio = new Customerio('202d0d8efc39e3364794', 'ff0f5ab843d2bde17df5');

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

app.use(session({ secret: 'omgitscronaaservice1987'})); //session secret
app.use(passport.initialize());
app.use(passport.session()); //persistent login session


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
      
    try{
        cio.track(req.user.id, 'getJobs', data, function(err, res) {
          if (err != null) {
            console.log('ERROR', err);
          }
          console.log('response headers', res.headers);
          return console.log('status code', res.statusCode);
        });
    }catch(e){}
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
  if (!req.body.expression || !req.body.url) return res.json({'error':'You must provide an expression and an url as POST parameters'});
  var job = new Job();
  job.expression = req.body.expression;
  job.url = req.body.url;
  job.user = req.user.id;
  job.save(function(err) {
    if (err) return next(err);
    if (CronTab.add(job)) {
      res.json(job);
        
    try{
        cio.track(req.user.id, 'addJob', data, function(err, res) {
          if (err != null) {
            console.log('ERROR', err);
          }
          console.log('response headers', res.headers);
          return console.log('status code', res.statusCode);
        });
    }catch(e){}
    } else {
      return res.json({'error':'Error adding Job'});
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
		return res.json({'error':'This job does not belong to you'});
	}
    res.json(job);
      
    try{
        cio.track(req.user.id, 'getJob', data, function(err, res) {
          if (err != null) {
            console.log('ERROR', err);
          }
          console.log('response headers', res.headers);
          return console.log('status code', res.statusCode);
        });
    }catch(e){}
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
    if (!job) return res.json({'error':'Trying to update non-existing job'});
    job.expression = req.params.expression;
    job.url = req.parms.url;
	job.user = req.user.id;
    job.save(function(err2) {
      if (err2) return next(err2);
      if (CronTab.update(job)) {
        res.json(job);
          
    try{
        cio.track(req.user.id, 'updateJob', data, function(err, res) {
          if (err != null) {
            console.log('ERROR', err);
          }
          console.log('response headers', res.headers);
          return console.log('status code', res.statusCode);
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
    if (!job) return res.json({'error':'Trying to remove non-existing job'});
    job.remove(function(err2) {
      if (err2) return next(err2);
      if (CronTab.remove(job)) {
        res.json({'response':'deleted'});
          
        try{
        cio.track(req.user.id, 'deleteJob', data, function(err, res) {
          if (err != null) {
            console.log('ERROR', err);
          }
          console.log('response headers', res.headers);
          return console.log('status code', res.statusCode);
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
    
  try{
        cio.track(req.user.id, 'getRoutes', data, function(err, res) {
          if (err != null) {
            console.log('ERROR', err);
          }
          console.log('response headers', res.headers);
          return console.log('status code', res.statusCode);
        });
    }catch(e){}
});

app.post('/user/:email', function(req, res, next) {
  User.findOne({ email: req.params.email }, function(err, user) {
    if (err) return next(err);
    if (user) return res.json({'error':'A user with this email exists'});
    var user = new User();
	user.email = req.params.email;
    user.apikey = crypto.createHash('sha256').update('salt').digest('hex');
	user.save(function(err) {
		if (err) return next(err);
		
		try{
			cio.identify(user._id.toString(), user.email, {
			  created_at: new Date(),
              apikey: user.apikey
			}, function(err, res) {
			  if (err != null) {
				console.log('ERROR', err);
			  }
			});
		}catch(err){
            console.log(err);
		}finally{
            res.json(user);
        }
	});
  });
});

if (!module.parent) {
  app.listen(3000);
  console.log('Express started on port 3000');
}

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) { return next(); }
  return res.json({'error':'You must provide a valid api key. Visit crontabasaservice.com to register.'});
}