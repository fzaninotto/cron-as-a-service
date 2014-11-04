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
	logger = require('morgan'),
    Customerio = require('node-customer.io');

/**
* Models
*/
var User     = require('../../models/user');

var app = module.exports = express();

app.use(logger('dev'));

var cio = new Customerio('202d0d8efc39e3364794', 'ff0f5ab843d2bde17df5');

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
        try{
        cio.track(user._id, 'webLogin', data, function(err, res) {
          if (err != null) {
            console.log('ERROR', err);
          }
          console.log('response headers', res.headers);
          return console.log('status code', res.statusCode);
        });
    }catch(e){}
      return done(null, user);
    });
  }
));

app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');
  app.use(express.static(__dirname + '/public'));

var homepage_test = {
    a:{background:'background.jpg',title:'Cron For Your Webapp'},
    b:{background:'fun.jpg',title:'So you can be out here, while we take care of your periodic jobs.'},
    c:{background:'puppy-love.jpg',title:'Because this guy won\'t walk himself. We\'ve got your cron jobs.'}
};

app.get('/', function(req, res, next) {
    var view = req.query.video ? 'index-video' : 'index';
  res.render(view, { 
      route: app.route ,  
      video_test : !req.query.video , 
      test : req.query.test ? homepage_test[req.query.test] : homepage_test.a});
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
                        title: '(1) Cron Dashboard',
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
  res.render('thanks', { 
	  title: 'Thanks!',
	  route: app.route 
  });
});

app.get('/contact', function(req, res, next) {
  res.render('contact', { 
	  title: 'Contact Us',
	  css: '/stylesheets/contact.css',
	  logo: true,
	  route: app.route 
  });
});

app.get('/customers', function(req, res, next) {
  res.render('customers', { 
	  title: 'Our Customers',
	  css: '/stylesheets/contact.css',
	  logo: true,
	  route: app.route 
  });
});

if (!module.parent) {
  app.listen(3000);
  console.log('Express started on port 3000');
}