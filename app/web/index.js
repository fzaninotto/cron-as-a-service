/**
 * Module dependencies.
 */
var express = require('express'),
	passport = require('passport'),
	LocalStrategy = require('passport-local').Strategy,
	session = require('express-session'),
    cookieParser = require('cookie-parser'),
	flash = require('connect-flash')
	partials = require('express-partials'),
	logger = require('morgan');

/**
* Models
*/
var User     = require('../../models/user');

var app = module.exports = express();

app.use(logger('dev'));

// load the express-partials middleware
app.use(partials());

app.use(cookieParser());
var hour = 3600000;
app.use(session({ cookie: { maxAge: hour }, secret: 'thisiscronasaserviceyes' }));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());

// middleware

passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(obj, done) {
  done(null, obj);
});

passport.use(new LocalStrategy(function(username, password, done) {
    User.findOne({ email: username, apikey:password }, function(err, user) {
      if (err) { 
        return done(err); 
      }
      if (!user) {
        return done(null, false, { message: 'Incorrect email address.' });
      }
      return done(null, user);
    });
  }
));

app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');
  app.use(express.static(__dirname + '/public'));

app.get('/', function(req, res, next) {
  res.render('index', { route: app.route });
});

app.get('/login', function(req, res, next) {
  res.render('login', { 
                        route: app.route,
                        css: '/stylesheets/login.css',
                        logo: true,
                        message: req.flash('error')
                      });
});

app.get('/home', function(req, res, next) {
    if(!req.user){
        return res.redirect('/login');
    }
    
    res.render('home', { 
                        route: app.route,
                        css: '/stylesheets/home.css',
                        logo: true,
                        hideNav: true,
                        apikey: req.user.apikey,
                        user: req.user
                     });
});

app.post('/login',
  passport.authenticate('local', {
    successRedirect: '/home',
    failureRedirect: '/login',
    failureFlash: true
  })
);

app.get('/thanks', function(req, res, next) {
  res.render('thanks', { route: app.route });
});

if (!module.parent) {
  app.listen(3000);
  console.log('Express started on port 3000');
}