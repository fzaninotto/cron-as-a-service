//count number of jobs by user
db.jobs.aggregate({$group:{_id:"$user", total: {$sum:1}}});

