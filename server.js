/*
 * Remote cron service
 */

process.env.TZ = 'UTC';//use UTC for all dates

var fs = require('fs'),
	config = require('config'),
	mongoose = require('mongoose'),
	bodyParser = require('body-parser'),
	express = require('express'),
	logger = require('morgan');

var raven = require('raven');
var client = new raven.Client('https://3c0011112cdf488cbcaaea6a9fbbb92d:ea784073d6cc4872910fa984d6b23fd7@app.getsentry.com/43811');

var CronTab = require('./lib/cronTab');
var Job = require('./models/job');

var app = module.exports = express();

var port = process.env.PORT || process.env.OPENSHIFT_NODEJS_PORT || '8080';
var ipaddr = process.env.IP || process.env.OPENSHIFT_NODEJS_IP || '127.0.0.1';

if (app.get('env') != 'development') {
	client.patchGlobal();
}

// configure mongodb
var mongoURL;
if (app.get('env') === 'development') {
	mongoURL = 'mongodb://matthewreid:password@127.0.0.1/cron?authSource=admin';
} else {
	mongoURL = process.env.OPENSHIFT_MONGODB_DB_URL || process.env.MONGO_URL;

	if (process.env.APP_CONFIG) {
		var config = JSON.parse(process.env.APP_CONFIG);

		mongoURL = "mongodb://" + config.mongo.user + ":" + encodeURIComponent(process.env.MONGODB_PASSWORD) + "@" +
			config.mongo.hostString;
	}
}

mongoose.connect(mongoURL, function (err) {
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
} else {
	var oneYear = 31557600000;
	app.use(express.static(__dirname + '/public', { maxAge: oneYear }));
}

// initialize jobs
var nbInitializedJobs = 0;
Job.find({}, function (err, jobs) {
	if (err) return callback(err);
	jobs.forEach(function (job) {
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
app.use('/payments', require('./app/payments'));
app.get('/pagecount', function (req, res) {
	res.send('ok');
});
app.use('/', require('./app/web'));

// load plugins
fs.exists('./plugins/index.js', function (exists) {
	if (exists) {
		require('./plugins').init(app, config, mongoose);
	};
});

if (app.get('env') === 'development' || process.env.IP || process.env.OPENSHIFT_NODEJS_IP) {
	app.listen(port, ipaddr, function () {
		console.log('%s: Node server started on %s:%d ...', Date(Date.now()), ipaddr, port);
	});
} else {
	app.listen(port, function () {
		console.log('%s: Node server started on %d ...', Date(Date.now()), port);
	});
}