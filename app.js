/*
 * Remote cron service
 */
var fs     = require('fs');
var config   = require('config');
var mongoose = require('mongoose');
var express  = require('express');
var http = require('http');
var bodyParser = require('body-parser');
var methodOverride = require('method-override');
var errorHandler = require('errorhandler');
var api = require('./app/api');

var CronTab = require('./lib/cronTab');
var Job     = require('./models/job');

// configure mongodb
mongoose.connect('mongodb://' + config.mongodb.user + ':' + config.mongodb.password + '@' + config.mongodb.server + ':' + config.mongodb.port + '/' + config.mongodb.database + '?authSource=' + config.mongodb.authSource);
mongoose.connection.on('error', function (err) {
  console.error('MongoDB error: ' + err.message);
  console.error('Make sure a mongoDB server is running and accessible by this application');
  process.exit();
});

var app = express();

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))

// parse application/json
app.use(bodyParser.json())

// override with the X-HTTP-Method-Override header in the request
app.use(methodOverride('X-HTTP-Method-Override'))

if (process.env.NODE_ENV === 'development') {
  if (config.verbose) mongoose.set('debug', true);
  app.use(express.static(__dirname + '/public'));
  app.use(errorHandler({ dumpExceptions: true, showStack: true }));
}

if (process.env.NODE_ENV === 'production') {
  var oneYear = 31557600000;
  app.use(express.static(__dirname + '/public', { maxAge: oneYear }));
  app.use(errorHandler());
}

// initialize jobs
var nbInitializedJobs = 0;
Job.find({}, function(err, docs) {
  if (err) return callback(err);
  docs.forEach(job => {
    CronTab.add(job);
    nbInitializedJobs++;
    console.log('Initialized job %s (target %s on %s)', job._id, job.url, job.expression);
  });

  if (nbInitializedJobs) {
    console.log('Initialization complete. %d jobs initialized.', nbInitializedJobs);
  } else {
    console.log('Starting with empty job collection.');
  }
});

process.on('exit', function () {
  var nbJobs = CronTab.removeAll();
  if (nbJobs) {
    console.log('Stopped %d jobs.', nbJobs);
  }
});

// Routes
app.use('/api', api);
app.use('/web', require('./app/web'));

// load plugins
fs.exists('./plugins/index.js', function(exists) {
  if (exists) {
    require('./plugins').init(app, config, mongoose);
  };
});

var server = http.createServer(app)
server.listen(config.server.port, function () {
  console.log("Express server listening on port %d in %s mode", config.server.port, app.settings.env);
})