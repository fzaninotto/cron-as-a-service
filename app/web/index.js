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
	expressValidator = require('express-validator'),
	logger = require('morgan'),
	i18n = require('../../lib/i18n'),//language detection
    utils = require('../../lib/utils'),
	twitterRss = process.env.CONSUMER_KEY ? (require('rss-twitter')(process.env.CONSUMER_KEY,process.env.CONSUMER_SECRET,process.env.ACCESS_TOKEN,process.env.ACCESS_SECRET)) : {};

/**
* Models
*/
var Job = require('../../models/job'),
	User     = require('../../models/user');
var CronTab = require('../../lib/cronTab');

var app = module.exports = express();

app.use(logger('dev'));

// load the express-partials middleware
app.use(partials());

app.use(cookieParser());
var hour = 3600000;
app.use(session({ cookie: { maxAge: hour }, secret: 'thisiscronasaserviceyes' }));
app.use(flash());
app.use(expressValidator());
app.use(passport.initialize());
app.use(passport.session());

if (app.get('env') === 'development') {
    app.use(function (req, res, next) {
       res.locals = {
         dev:true
       };
       next();
    });
}

i18n.configure({
  locales: ['en', 'en-us', 'en-gb', 'en-au'],
  cookie: 'cronasaservice-locale',
  directory: __dirname+'/locales'
});
app.use(i18n.init);

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
            utils.cio.track(user._id, 'webLogin', data, function(err, res) {
              if (err != null) {
                console.log('ERROR', err);
              }
              return console.log('status code', res.statusCode);
            });
        }catch(e){}finally{
            return done(null, user);
        }
    });
  }
));

app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');
  app.use(express.static(__dirname + '/public'));

var homepage_test = {
    a:{background:'background.jpg',title:'Cron For Your Webapp'},
    b:{background:'fun.jpg',title:'So you can be out here, while we take care of your periodic jobs.'},
    c:{background:'puppy-love.jpg',title:'Because this guy won\'t walk himself. We\'ve got your cron jobs.'},
	d:{background:'fun.jpg',title:'Schedule regular HTTP requests to your webapp.'}//based on B (test winner), make wording more obvious
};

app.get('/', function(req, res, next) {
  res.render('index', { 
      route: app.route ,  
      video_test : !req.query.video , 
      test : homepage_test.d//test winner
  });
});

app.get('/login', function(req, res, next) {
  res.render('login', { 
                        route: app.route,
                        css: '/stylesheets/login.css',
                        logo: true,
                        message: req.flash('error')
                      });
});

app.get('/logout', function(req, res){
  req.logout();
  res.redirect('/');
});

app.get(['/home','/upgrade'], function(req, res, next) {
    if(!req.user){
        return res.redirect('/login');
    }
    
    res.render('home', { 
                        title: '(1) Cron Dashboard',
                        route: app.route,
                        logo: true,
                        hideNav: true,
                        apikey: req.user.apikey,
                        user: req.user,
                        css: '/stylesheets/home.css',
                        layout: 'homelayout'
                     });
});

app.post('/register', function(req, res, next) {
  req.assert('email', 'Oops you left your email out').notEmpty();       
	
  var errors = req.validationErrors();
	
  if(errors){
  	res.render('index', { 
		  route: app.route ,
		  video_test : !req.query.video , 
          test : req.query.test ? homepage_test[req.query.test] : homepage_test.d,
		  errors : errors
	  });
  }else{
  	User.findOne({ email: req.body.email }, function(err, user) {
		if (err) return next(err);
		if (user){
			return res.render('index', { 
					  route: app.route ,
					  video_test : !req.query.video , 
					  test : req.query.test ? homepage_test[req.query.test] : homepage_test.d,
					  errors : [{msg:'A user with this email already exists'}]
				  });
		}else{
			utils.createUser(req,res,next,errors);
		}
	  });
  }
});

app.post('/login',
  passport.authenticate('local', {
    successRedirect: '/home',
    failureRedirect: '/login',
    failureFlash: true
  })
);

app.get('/thanks', function(req, res, next) {
  if(!req.user){
        return res.redirect('/');
  }
	
  res.render('thanks', { 
	  title: 'Thanks!!!',
	  css: '/stylesheets/login.css',
      logo: true,
	  route: app.route,
	  message: req.flash('error')
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

app.get('/terms', function(req, res, next) {
  res.render('terms', { 
	  title: 'Terms of Use',
      css: '/stylesheets/terms.css',
	  logo: true,
	  route: app.route 
  });
});

app.get('/privacy', function(req, res, next) {
  res.render('privacy', { 
	  title: 'Privacy Policy',
      css: '/stylesheets/terms.css',
	  logo: true,
	  route: app.route 
  });
});

app.get('/keep-heroku-alive', function(req, res, next) {
  res.render('keep-app-alive', { 
      title: 'Keep Heroku alive',
      css: '/stylesheets/keepalive.css',
      logo: true,
      route: app.route
  });
});

app.post('/keep-alive', function(req, res, next) {	
  req.assert('email', 'Oops you left your email out').notEmpty();   
  req.assert('url', 'Oops you forgot the url')
  req.assert('token', 'Oops we couldn\'t confirm your payment');
	
  var errors = req.validationErrors();
  if(errors){
      res.render('keep-app-alive', { 
          title: 'Keep Heroku alive',
          css: '/stylesheets/keepalive.css',
          logo: true,
          route: app.route,
          errors : errors
      });
  }else{
    var token = req.body.token;
    
    User.findOne({ email: req.body.email }, function(err, user) {
        if(user){
            User.update({_id: user._id}, {$addToSet:{ attr:{name:'stripeToken',value:token} } } ,function(){
                utils.chargeKeepAliveUser(user,token,res.__("price_num"),res.__("currency"),req.body.url);
                res.render('thanks', { 
                      title: 'Thanks!',
                      css: '/stylesheets/login.css',
                      logo: true,
                      user: user,
                      route: app.route,
                      message: req.flash('error')
                  });
            });
        }else{
            utils.createUser(req, res, next, errors, ['keepalive'], function(user){
                utils.chargeKeepAliveUser(user,token,res.__("price_num"),res.__("currency"),req.body.url);
            });
        }
    });    
  }
});

app.post('/tourcomplete', function(req, res, next) {
    if(!req.user){
        res.json({error:true});
    }else{
        User.findOne({ _id: req.user._id }, function(err, user) {
            user.features.push('tourcomplete');
            user.save(function(err,user){
                req.logIn(user,function(){
                        res.json({succes:true}); 
                    });
            });
        });
    }
});

//twitter feed as rss
app.get('/rss.xml', function(req, res, next){
	twitterRss.feed('cronasaservice', function(err, feed){
		if(err){
			res.send('404 Not found', 404);
		}else{
			res.set('Content-Type', 'text/xml');
      		res.send(feed.render('rss-2.0'));
		}
	});
});

app.post('/upgrade', function(req, res, next){
  req.assert('plan', 'Oops we couldn\'t confirm your payment');    
  req.assert('token', 'Oops we couldn\'t confirm your payment');
	
  var errors = req.validationErrors();
  
  if(!req.user){
    errors = [{'msg':'Oops, something went wrong. Try refreshing the page'}];
  }
    
  if(errors){
      res.render('home', { 
                        title: '(1) Cron Dashboard',
                        route: app.route,
                        logo: true,
                        hideNav: true,
                        apikey: req.user.apikey,
                        user: req.user,
                        css: '/stylesheets/home.css',
                        layout: 'homelayout',
                        errors: errors
                     });
  }else{
    var token = req.body.token;
    var plan = req.body.plan;
    
    utils.createPlan(req.user, token, (plan+'_'+res.__("currency")).toLowerCase(), function(err,user){
        if(err) {
            errors = [{'msg':'Sorry, something went wrong creating your subscription: ' + err}];
        }else{
            messages = [{'msg':'Success, we have upgraded you to the '+plan+' plan! Wohoo!'}]
        }
        
        req.user = user;
        
        res.render('home', { 
                        title: '(1) Cron Dashboard',
                        route: app.route,
                        logo: true,
                        hideNav: true,
                        apikey: req.user.apikey,
                        user: req.user,
                        css: '/stylesheets/home.css',
                        layout: 'homelayout',
                        errors: errors,
                        messages: messages
                     });
    });  
  }
});

if (!module.parent) {
  app.listen(3000);
  console.log('Express started on port 3000');
}