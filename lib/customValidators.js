var EmailBlacklist = require('./email-blacklist').blacklist;

Array.prototype.contains = function(element){
    return this.indexOf(element) > -1;
};

module.exports.customValidators = function(){
    return expressValidator({
         customValidators: {
            nonSpamEmail: function(value) {
                //check that the email is not on the blacklist
               return !EmailBlacklist.contains(value);
            }
         }
    });
};