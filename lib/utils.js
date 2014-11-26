var	crypto = require('crypto'),
    Customerio = require('node-customer.io'),
    stripe = require("stripe")(process.env.STRIPE_KEY || "sk_test_Rxeymr9rtmyNDD6dxx1UNd0T");

/**
* Models
*/
var Job = require('../models/job'),
	User     = require('../models/user');
var CronTab = require('./cronTab');

var cio = new Customerio(process.env.CUSTOMERIO_KEY || 'f138f48dcee884404b51 ', process.env.CUSTOMERIO_PASS || '09e04da58088d655acc1 ');

module.exports.createUser = function (req, res, next, errors, features, callback) {
    var user = new User();
    user.email = req.body.email;
    user.apikey = crypto.createHash('sha256').update('salt').digest('hex');
    user.features = features != null ? features : [];
    user.save(function(err) {
        if (err){
            return res.render('index', { 
                  route: app.route ,
                  video_test : !req.query.video , 
                  test : req.query.test ? homepage_test[req.query.test] : homepage_test.a,
                  errors : errors
              });
        }

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
            res.render('thanks', { 
              title: 'Thanks!',
              css: '/stylesheets/login.css',
              logo: true,
              user: user,
              message: req.flash('error')
          });
        }
        
        if(typeof callback === 'function'){
            callback(user);
        }
    });
};

module.exports.chargeKeepAliveUser = function (user,token,amount,currency,url) {
    stripe.charges.create({
      amount: amount,
      currency: currency,
      card: token,
      description: "Charge for Keep Heroku Alive - "+user.email
    }, function(err, charge) {
      var job = new Job();
      job.expression = Math.floor((Math.random() * (60 - 0) + 0)) + ' * * * *';//every hour
      job.url = url;
      job.user = user._id;
      job.method = 'get';
      job.save(function(err) {
        if (err) return next(err);
        if (CronTab.add(job)) {
        try{
            cio.track(req.user._id, 'addKeepAliveJob', data, function(err, res) {
              if (err != null) {
                console.log('ERROR', err);
              }
            });
        }catch(e){}
        } else {
          console.log('error creating keep alive job')
        }
      });
    });
};

module.exports.cio = cio;