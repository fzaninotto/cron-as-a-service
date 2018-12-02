var crypto = require('crypto'),
    tracking = require('./tracking'),
    nodemailer = require('nodemailer'),
    sendgridTransport = require('nodemailer-sendgrid-transport');
var stripe = require('stripe')(process.env.STRIPE_KEY || 'sk_test_Rxeymr9rtmyNDD6dxx1UNd0T');
var leadscore = require('clearbit-leadscore')('11b55ba6b371b0a6ea78572e34e3dab7');
var mailerLite = require('./mailerLite')(process.env.MAILER_LITE_KEY || 'b31b1f6523446b98754d63e86c993b2b');

var INFLUENCE_THRESHOLD = 0.5; //baller clearbit influence score

/**
 * Models
 */
var Job = require('../models/job'),
    User = require('../models/user');
var CronTab = require('./cronTab');

var options = {
    auth: {
        api_user: process.env.SEND_GRID_USER || '',
        api_key: process.env.SEND_GRID_PASS || '',
    },
};

var smtpTransport = nodemailer.createTransport(sendgridTransport(options));

var generateToken = function() {
    var current_date = new Date().valueOf().toString();
    var random = Math.random().toString();
    return crypto
        .createHash('sha256')
        .update(current_date + random)
        .digest('hex');
};

module.exports.generateToken = generateToken;

module.exports.createUser = function(req, res, next, errors, features, callback) {
    var user = new User();
    user.email = req.body.email;
    user.apikey = generateToken(); //generate a new random token
    user.features = features != null ? features : [];
    user.save(function(err) {
        if (err) {
            return res.render('index', {
                route: app.route,
                video_test: !req.query.video,
                test: req.query.test ? homepage_test[req.query.test] : homepage_test.a,
                errors: errors,
            });
        }

        tracking.track({
            user_id: req.session.user_token,
            user_joined_at: req.session.first_visit,
            event: 'register',
            via: 'web',
        });

        try {
            if (user.email) {
                mailerLite.subscribers
                    .addOne(user.email, '', {
                        created_at: new Date().getTime(),
                        influential: user.influential,
                    })
                    .catch(err => {
                        if (err) {
                            console.log(err);
                        }
                    });
            }
        } catch (err) {
            console.log(err);
        } finally {
            res.render('thanks', {
                title: 'Thanks!',
                css: '/stylesheets/login.css',
                logo: true,
                user: user,
                message: req.flash('error'),
            });
        }

        if (typeof callback === 'function') {
            callback(user);
        }
    });

    leadscore.lookup(user.email).then(function(person) {
        User.update({ _id: user._id }, { info: person }, function() {});

        if (person.leadScore > INFLUENCE_THRESHOLD) {
            var mailOptions = {
                to: 'mc.reidie@gmail.com',
                from: 'hello@cronasaservice.com',
                subject: 'New Influential User - Cron As A Service',
                text: user.email,
            };
            utils.sendEmail(mailOptions, function(err) {});
        }
    });
};

module.exports.chargeKeepAliveUser = function(user, token, amount, currency, url) {
    stripe.charges.create(
        {
            amount: amount,
            currency: currency,
            card: token,
            description: 'Charge for Keep Heroku Alive - ' + user.email,
        },
        function(err, charge) {
            var job = new Job();
            job.expression = Math.floor(Math.random() * (60 - 0) + 0) + ' * * * *'; //every hour
            job.url = url;
            job.user = user._id;
            job.method = 'get';
            job.save(function(err) {
                if (err) return next(err);
                if (CronTab.add(job)) {
                    try {
                        /*cio.track(req.user._id, 'addKeepAliveJob', data, function(err, res) {
                            if (err != null) {
                                console.log('ERROR', err);
                            }*/
                    } catch (e) {}
                } else {
                    console.log('error creating keep alive job');
                }
            });
        }
    );
};

module.exports.createPlan = function(opts, callback) {
    var user = opts.user;
    var plan = opts.plan;
    var token = opts.token;
    var coupon = opts.coupon;

    stripe.customers.create(
        {
            source: token,
            plan: plan,
            email: user.email,
            coupon: coupon,
        },
        function(err, customer) {
            if (err) return callback(err);

            User.findOne({ _id: user._id }, function(err, user) {
                if (err) return callback(err);

                user.stripe.customerId = customer.id;
                user.stripe.plan = plan;
                user.stripe.token = token;

                user.save(function(err, user) {
                    if (err) callback(err, user);

                    try {
                        /*utils.cio.track(req.user._id, 'upgradePlan', user.stripe, function(err, res) {
                            if (err != null) {
                                console.log('ERROR', err);
                            }
                        });*/
                    } catch (e) {}
                    return callback(null, user);
                });
            });
        }
    );
};

module.exports.sendEmail = function(options, err) {
    smtpTransport.sendMail(options, err);
};
