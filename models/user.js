var mongoose = require('mongoose'),
    bcrypt = require('bcrypt-nodejs');
var Schema = mongoose.Schema;

// main model
var User = new Schema(
    {
        apikey: String,
        token: String,
        created_at: { type: Date, default: Date.now },
        email: { type: String, index: { unique: true } },
        name: String,
        password: String,
        resetPasswordToken: String,
        resetPasswordExpires: Date,
        features: [],
        attr: [{ name: String, value: String }],
        info: {},
        stripe: {
            customerId: String,
            token: String,
            plan: {
                type: String,
                default: 'free',
            },
        },
    },
    {
        toObject: { getters: true },
        usePushEach: true,
    }
);

User.pre('save', function(next) {
    var user = this;
    var SALT_FACTOR = 5;

    if (!user.isModified('password')) return next();

    bcrypt.genSalt(SALT_FACTOR, function(err, salt) {
        if (err) return next(err);

        bcrypt.hash(user.password, salt, null, function(err, hash) {
            if (err) return next(err);
            user.password = hash;
            next();
        });
    });
});

User.methods.comparePassword = function(candidatePassword, cb) {
    bcrypt.compare(candidatePassword, this.password, function(err, isMatch) {
        if (err) return cb(err);
        cb(null, isMatch);
    });
};

module.exports = mongoose.model('User', User);
