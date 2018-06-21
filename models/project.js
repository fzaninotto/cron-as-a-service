var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// Project -(one-to-many)> Job
var Project = new Schema(
    {
        name: String,
        created_at: { type: Date, default: Date.now },
        created_by: { type: String, index: true },
        users: [String],
    },
    {
        toObject: { getters: true },
        usePushEach: true,
    }
);

module.exports = mongoose.model('Project', Project);
