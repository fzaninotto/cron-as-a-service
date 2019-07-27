var EmailBlacklist = require('./email-blacklist').blacklist;

Array.prototype.contains = function(element) {
    return this.indexOf(element) > -1;
};

module.exports.customValidators = function() {
    return expressValidator({
        customValidators: {
            nonSpamEmail: function(value) {
                if (value.indexOf('@') === -1) {
                    //not a valid email
                    return false;
                }
                //check that the email host is not on the blacklist
                return !EmailBlacklist.contains(value.toLowerCase().split('@')[1]);
            },
        },
    });
};
