/*
 * Remote cron service
 */
var path     = require('path');
var config   = require('config');
var mongoose = require('mongoose');
var express  = require('express');

var CronTab = require('./lib/cronTab');
var Job     = require('./models/job');

// configure mongodb
mongoose.connect('mongodb://' + config.mongodb.user + ':' + config.mongodb.password + '@' + config.mongodb.server +'/' + config.mongodb.database);
mongoose.connection.on('error', function (err) {
  console.error('MongoDB error: ' + err.message);
  console.error('Make sure a mongoDB server is running and accessible by this application');
  process.exit();
});

var app = module.exports = express.createServer();

app.configure(function(){
  app.use(app.router);
  app.use(express.bodyParser());
  app.use(express.methodOverride());
});

app.configure('development', function() {
  if (config.verbose) mongoose.set('debug', true);
  app.use(express.static(__dirname + '/public'));
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function() {
  var oneYear = 31557600000;
  app.use(express.static(__dirname + '/public', { maxAge: oneYear }));
  app.use(express.errorHandler());
});

// initialize jobs
var nbInitializedJobs = 0;
Job.find({}).each(function(err, job) {
  if (err) return callback(err);
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

process.on('exit', function () {
  var nbJobs = CronTab.removeAll();
  if (nbJobs) {
    console.log('Stopped %d jobs.', nbJobs);
  }
});

// Routes
app.use('/api', require('./app/api'));
app.use('/web', require('./app/web'));

// load plugins
path.exists('./plugins/index.js', function(exists) {
  if (exists) {
    require('./plugins').init(app, config, mongoose);
  };
});

app.listen(config.server.port);
console.log("Express server listening on port %d in %s mode", config.server.port, app.settings.env);