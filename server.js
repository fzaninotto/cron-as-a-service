/*
 * Remote cron service
 */

process.env.TZ = 'UTC';//use UTC for all dates

var fs     = require('fs'),
	config   = require('config'),
	mongoose = require('mongoose'),
	bodyParser = require('body-parser'),
	express  = require('express'),
	logger = require('morgan'),
	
	port    = process.env.OPENSHIFT_NODEJS_PORT || '9090',
    ipaddr  = process.env.OPENSHIFT_NODEJS_IP || '127.0.0.1';

var raven = require('raven');
var client = new raven.Client('https://3c0011112cdf488cbcaaea6a9fbbb92d:ea784073d6cc4872910fa984d6b23fd7@app.getsentry.com/43811');

var CronTab = require('./lib/cronTab');
var Job     = require('./models/job');

var app = module.exports = express();

if (app.get('env') != 'development') {
    client.patchGlobal();
}

// configure mongodb
var dbUrl;
if (app.get('env') === 'development') {
	dbUrl = 'mongodb://localhost/cron';
} else {
	dbUrl = process.env.OPENSHIFT_MONGODB_DB_URL + process.env.OPENSHIFT_APP_NAME;
}

 mongoose.connect(dbUrl, function(err) {
	if (err) {
		console.log("MongoDB error:" + err);
		process.exit();
	}
});
mongoose.connection.on('error', function (err) {
  console.error('MongoDB error: ' + err.message);
  console.error('Make sure a mongoDB server is running and accessible by this application');
  process.exit();
});

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));

if (app.get('env') === 'development') {
	if (config.verbose) mongoose.set('debug', true);
	app.use(express.static(__dirname + '/public'));
}else{
	var oneYear = 31557600000;
	app.use(express.static(__dirname + '/public', { maxAge: oneYear }));
}

// initialize jobs
var nbInitializedJobs = 0;
Job.find({}, function(err, jobs) {
  if (err) return callback(err);
  jobs.forEach(function(job){
  	if (job) {
		CronTab.add(job);
		nbInitializedJobs++;
		console.log('Initialized job %s (target %s on %s)', job._id, job.url, job.expression);
	  } else {
		if (nbInitializedJobs) {
		  console.log('Initialization complete. %d jobs initialized.', nbInitializedJobs);
		} else {
		  console.log('Starting with empty job collection.');
		}
	  }
  });
});

process.on('exit', function () {
  var nbJobs = CronTab.removeAll();
  if (nbJobs) {
    console.log('Stopped %d jobs.', nbJobs);
  }
});

// Routes
app.use('/api', require('./app/api'));
app.use('/', require('./app/web'));

// load plugins
fs.exists('./plugins/index.js', function(exists) {
  if (exists) {
    require('./plugins').init(app, config, mongoose);
  };
});

app.listen(port, ipaddr, function(){
  console.log('%s: Node server started on %s:%d ...', Date(Date.now()), ipaddr, port);
});