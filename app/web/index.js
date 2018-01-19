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
  crypto = require('crypto'),
  async = require('async'),
  logger = require('morgan'),
  i18n = require('../../lib/i18n'),//language detection
  utils = require('../../lib/utils'),
  tracking = require('../../lib/tracking'),
  customValidators = require('../../lib/customValidators').customValidators,
  twitterRss = process.env.CONSUMER_KEY ? (require('rss-twitter')(process.env.CONSUMER_KEY, process.env.CONSUMER_SECRET, process.env.ACCESS_TOKEN, process.env.ACCESS_SECRET)) : {};

/**
* Models
*/
var Job = require('../../models/job');
var User = require('../../models/user');
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

//Session tracking cookies
var sessions = require("client-sessions");
app.use(sessions({
  cookieName: 'session',
  secret: 'kJTY7WNCy7e8f6uja6TcyH6UsNHF4t',
  duration: 365 * 24 * 60 * 60 * 1000 //1 year
}));

if (app.get('env') === 'development') {
  app.use(function (req, res, next) {
    res.locals = {
      dev: true
    };
    next();
  });
}

i18n.configure({
  locales: ['en', 'en-us', 'en-gb', 'en-au'],
  cookie: 'cronasaservice-locale',
  directory: __dirname + '/locales'
});
app.use(i18n.init);

app.use(customValidators());

// middleware

passport.serializeUser(function (user, done) {
  done(null, user.id);
});

passport.deserializeUser(function (id, done) {
  User.findById(id, function (err, user) {
    done(err, user);
  });
});

passport.use(new LocalStrategy(function (username, password, done) {
  User.findOne({ email: username }, function (err, user) {
    if (err) {
      return done(err);
    }
    if (!user) {
      return done(null, false, { message: 'Incorrect password.' });
    }

    var hasPassword = typeof user.password != 'undefined' && user.password.length > 0;

    if (!hasPassword && user.apikey === password) {
      try {
        utils.cio.track(user._id, 'webLogin', data, function (err, res) {
          if (err != null) {
            console.log('ERROR', err);
          }
          return console.log('status code', res.statusCode);
        });
      } catch (e) { } finally {
        return done(null, user);
      }
    } else if (hasPassword) {
      user.comparePassword(password, function (err, isMatch) {
        if (isMatch) {
          try {
            utils.cio.track(user._id, 'webLogin', data, function (err, res) {
              if (err != null) {
                console.log('ERROR', err);
              }
              return console.log('status code', res.statusCode);
            });
          } catch (e) { } finally {
            return done(null, user);
          }
        } else {
          return done(null, false, { message: 'Incorrect password.' });
        }
      });
    } else {
      return done(null, false, { message: 'Incorrect email address or password.' });
    }

  });
}
));

//tracking middleware
app.use(function (req, res, next) {
  //check the user-agent isn't a bot (or actually exists at all)
  var userAgent = req.headers['user-agent'];
  if (!userAgent || userAgent.match(/bot|index|spider|crawl|wget|slurp|Mediapartners-Google/i)) {
    return next();
  }

  //if no user token has been generated, create one and set it on the session cookie
  if (!req.session.user_token) {
    req.session.user_token = utils.generateToken();
  }

  if (!req.session.first_visit) {//this is the user's first visit, send it to the tracking url
    req.session.first_visit = new Date().getTime();

    tracking.track({
      user_id: req.session.user_token,
      user_joined_at: req.session.first_visit,
      event: 'landing',
      via: 'web'
    });
  }
  next();
});

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/public'));

var homepage_test = {
  a: { background: 'background.jpg', title: 'Cron For Your Webapp' },
  b: { background: 'fun.jpg', title: 'So you can be out here, while we take care of your periodic jobs.' },
  c: { background: 'puppy-love.jpg', title: 'Because this guy won\'t walk himself. We\'ve got your cron jobs.' },
  d: { background: 'fun.jpg', title: 'Schedule regular HTTP requests to your webapp.' }//based on B (test winner), make wording more obvious
};

app.get('/', function (req, res, next) {
  res.render('index', {
    route: app.route,
    video_test: !req.query.video,
    test: homepage_test.d//test winner
  });
});

app.get('/login', function (req, res, next) {
  res.render('login', {
    route: app.route,
    css: '/stylesheets/login.css',
    logo: true,
    messages: {
      error: req.flash('error'),
      info: req.flash('info'),
      success: req.flash('success')
    }
  });
});

app.get('/logout', function (req, res) {
  req.logout();
  res.redirect('/');
});

app.get('/forgot', function (req, res, next) {
  res.render('forgot-password', {
    route: app.route,
    css: '/stylesheets/login.css',
    logo: true,
    messages: {
      error: req.flash('error'),
      info: req.flash('info'),
      success: req.flash('success')
    }
  });
});

app.post('/forgot', function (req, res, next) {
  async.waterfall([
    function (done) {
      crypto.randomBytes(20, function (err, buf) {
        var token = buf.toString('hex');
        done(err, token);
      });
    },
    function (token, done) {
      User.findOne({ email: req.body.email }, function (err, user) {
        if (!user) {
          req.flash('error', 'No account with that email address exists.');
          return res.redirect('/forgot');
        }

        user.resetPasswordToken = token;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

        user.save(function (err) {
          done(err, token, user);
        });
      });
    },
    function (token, user, done) {
      var mailOptions = {
        to: user.email,
        from: 'passwordreset@cronasaservice.com',
        subject: 'Password Reset - Cron As A Service',
        text: 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
          'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
          'http://' + req.headers.host + '/reset/' + token + '\n\n' +
          'If you did not request this, please ignore this email and your password will remain unchanged.\n'
      };
      utils.sendEmail(mailOptions, function (err) {
        req.flash('info', 'An e-mail has been sent to ' + user.email + ' with further instructions.');
        done(err, 'done');
      });
    }
  ], function (err) {
    if (err) return next(err);
    res.redirect('/forgot');
  });
});

app.get('/reset/:token', function (req, res) {
  User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function (err, user) {
    if (!user) {
      req.flash('error', 'Password reset token is invalid or has expired.');
      return res.redirect('/forgot');
    }
    res.render('reset-password', {
      token: req.params.token,
      route: app.route,
      css: '/stylesheets/login.css',
      logo: true,
      messages: {
        error: req.flash('error'),
        info: req.flash('info'),
        success: req.flash('success')
      }
    });
  });
});

app.post('/reset/:token', function (req, res) {
  async.waterfall([
    function (done) {
      User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function (err, user) {
        if (!user) {
          req.flash('error', 'Password reset token is invalid or has expired.');
          return res.redirect('back');
        }

        user.password = req.body.password;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;

        user.save(function (err) {
          req.logIn(user, function (err) {
            done(err, user);
          });
        });
      });
    },
    function (user, done) {
      var mailOptions = {
        to: user.email,
        from: 'passwordreset@cronasaservice.com',
        subject: 'Your password has been changed',
        text: 'Hello,\n\n' +
          'This is a confirmation that the password for your account ' + user.email + ' has just been changed.\n'
      };
      utils.sendEmail(mailOptions, function (err) {
        req.flash('success', 'Success! Your password has been changed.');
        done(err);
      });
    }
  ], function (err) {
    res.redirect('/login');
  });
});

app.get(['/home', '/upgrade'], function (req, res, next) {
  if (!req.user) {
    return res.redirect('/login');
  }

  res.render('home', {
    title: 'Cron As A Service',
    route: app.route,
    logo: true,
    hideNav: true,
    apikey: req.user.apikey,
    user: req.user,
    css: '/stylesheets/home.css',
    layout: 'homelayout'
  });
});

app.post('/register', function (req, res, next) {
  req.checkBody('email', 'Oops you left your email out').notEmpty().nonSpamEmail();

  var errors = req.validationErrors();

  if (errors) {
    res.render('index', {
      route: app.route,
      video_test: !req.query.video,
      test: req.query.test ? homepage_test[req.query.test] : homepage_test.d,
      errors: errors
    });
  } else {
    User.findOne({ email: req.body.email }, function (err, user) {
      if (err) return next(err);
      if (user) {
        return res.render('index', {
          route: app.route,
          video_test: !req.query.video,
          test: req.query.test ? homepage_test[req.query.test] : homepage_test.d,
          errors: [{ msg: 'A user with this email already exists' }]
        });
      } else {
        utils.createUser(req, res, next, errors);
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

app.get('/thanks', function (req, res, next) {
  if (!req.user) {
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

app.get('/contact', function (req, res, next) {
  res.render('contact', {
    title: 'Contact Us',
    css: '/stylesheets/contact.css',
    logo: true,
    route: app.route
  });
});

app.get('/customers', function (req, res, next) {
  res.render('customers', {
    title: 'Our Customers',
    css: '/stylesheets/contact.css',
    logo: true,
    route: app.route
  });
});

app.get('/pricing', function (req, res, next) {
  res.render('pricing', {
    title: 'Our Pricing',
    css: '/stylesheets/pricing.css',
    logo: true,
    route: app.route
  });
});

app.get('/terms', function (req, res, next) {
  res.render('terms', {
    title: 'Terms of Use',
    css: '/stylesheets/terms.css',
    logo: true,
    route: app.route
  });
});

app.get('/privacy', function (req, res, next) {
  res.render('privacy', {
    title: 'Privacy Policy',
    css: '/stylesheets/terms.css',
    logo: true,
    route: app.route
  });
});

app.get('/keep-heroku-alive', function (req, res, next) {
  res.render('keep-app-alive', {
    title: 'Keep Heroku alive',
    css: '/stylesheets/keepalive.css',
    logo: true,
    route: app.route
  });
});

app.post('/keep-alive', function (req, res, next) {
  req.checkBody('email', 'Oops you left your email out').notEmpty();
  req.checkBody('url', 'Oops you forgot the url')
  req.checkBody('token', 'Oops we couldn\'t confirm your payment');

  var errors = req.validationErrors();
  if (errors) {
    res.render('keep-app-alive', {
      title: 'Keep Heroku alive',
      css: '/stylesheets/keepalive.css',
      logo: true,
      route: app.route,
      errors: errors
    });
  } else {
    var token = req.body.token;

    User.findOne({ email: req.body.email }, function (err, user) {
      if (user) {
        User.update({ _id: user._id }, { $addToSet: { attr: { name: 'stripeToken', value: token } } }, function () {
          utils.chargeKeepAliveUser(user, token, res.__("price_num"), res.__("currency"), req.body.url);
          res.render('thanks', {
            title: 'Thanks!',
            css: '/stylesheets/login.css',
            logo: true,
            user: user,
            route: app.route,
            message: req.flash('error')
          });
        });
      } else {
        utils.createUser(req, res, next, errors, ['keepalive'], function (user) {
          utils.chargeKeepAliveUser(user, token, res.__("price_num"), res.__("currency"), req.body.url);
        });
      }
    });
  }
});

//TODO: Find a better way to login and redirect a user
/*
* PARAMETERS
* t = apiKey for user
* r = redirect url
*/
app.get('/ln', function (req, res, next) {
  //check the required parameters are present
  if (!req.query.t || !req.query.r) {
    res.redirect('/login');
  } else {
    User.findOne({ apikey: req.query.t }, function (err, user) {
      if (!user) {//user not found for this apiKey
        res.redirect('/login');
      }

      req.logIn(user, function () {
        res.redirect('/' + req.query.r);
      });
    });
  }
});

app.post('/tourcomplete', function (req, res, next) {
  if (!req.user) {
    res.json({ error: true });
  } else {
    User.findOne({ _id: req.user._id }, function (err, user) {
      user.features.push('tourcomplete');
      user.save(function (err, user) {
        req.logIn(user, function () {
          res.json({ succes: true });
        });
      });
    });
  }
});

app.post('/user/update', function (req, res, next) {
  if (!req.user || !req.body.user) {
    res.status(400);
    res.json({ error: true });
  } else {
    User.findOne({ _id: req.user._id }, function (err, user) {
      var data = req.body.user;
      if (data.name) {
        user.name = data.name;
      }
      if (data.password) {
        user.password = data.password;
      }
      if (data.invoice_email) {
        if (!user.info) user.info = {};

        user.info.invoice_email = data.invoice_email;
      }
      user.save(function (err, user) {
        req.logIn(user, function () {
          res.json({ succes: true });
        });
      });
    });
  }
});

//twitter feed as rss
app.get('/rss.xml', function (req, res, next) {
  twitterRss.feed('cronasaservice', function (err, feed) {
    if (err) {
      res.send('404 Not found', 404);
    } else {
      res.set('Content-Type', 'text/xml');
      res.send(feed.render('rss-2.0'));
    }
  });
});

app.post('/upgrade', function (req, res, next) {
  req.checkBody('plan', 'Oops we couldn\'t confirm your payment');
  req.checkBody('token', 'Oops we couldn\'t confirm your payment');

  var errors = req.validationErrors();

  if (!req.user) {
    req.flash('error', 'Oops. Something went wrong. Try logging into your account again.');
    res.redirect('/login');
  }

  if (errors) {
    res.render('home', {
      title: 'Cron As A Service',
      route: app.route,
      logo: true,
      hideNav: true,
      apikey: req.user.apikey,
      user: req.user,
      css: '/stylesheets/home.css',
      layout: 'homelayout',
      errors: errors
    });
  } else {
    var token = req.body.token;
    var plan = req.body.plan;

    utils.createPlan(req.user, token, (plan + '_' + res.__("currency")).toLowerCase(), function (err, user) {
      var messages = [];

      if (err || !user) {
        errors = [{ 'msg': 'Sorry, something went wrong creating your subscription: ' + err }];
      } else {
        messages = [{ 'msg': 'Success, we have upgraded you to the ' + plan + ' plan! Wohoo!' }]
      }

      req.user = user || req.user;//replace logged in user with one containing new plan

      tracking.track({
        user_id: req.session.user_token,
        user_joined_at: req.session.first_visit,
        event: 'upgrade',
        via: 'web'
      });

      res.render('home', {
        title: 'Cron As A Service',
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