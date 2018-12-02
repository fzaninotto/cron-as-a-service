var unirest = require('unirest');

module.exports = function(apiKey) {
    return {
        subscribers: {
            addOne: function(email, name, fields) {
                return new Promise(function(resolve, reject) {
                    unirest
                        .post('https://api.mailerlite.com/api/v2/subscribers')
                        .headers({ 'Content-Type': 'application/json', 'X-MailerLite-ApiKey': apiKey })
                        .send({ email, name, fields })
                        .end(function(response) {
                            if (!response) {
                                reject('Something went wrong calling mailerlite');
                            } else if (response.error) {
                                reject(response.error);
                            } else {
                                resolve(response.body);
                            }
                        });
                });
            },
        },
    };
};
