cron-as-a-service
=================

A simple remote cron service using Node.js and MongoDB.

Features
--------

* Each cron job polls a web resource via a GET request at regular intervals.
* Familiar cron scheduling (e.g. '00 30 11 * * 2-6') (powered by [node-cron](https://github.com/ncb000gt/node-cron)).
* Comprehensive RESTful API for creating, listing, updating and deleting cron jobs
* Easy installation and zero administration

Installation
------------

Clone the repository from GitHub and install dependencies using npm:

    > git clone git://github.com/fzaninotto/cron-as-a-service.git
    > npm install

Start the application with:

    > node server

Head to the API root for a list of available resources:

    http://localhost:9090/api/
    
Jobs CRUD
---------

A job is composed of an expression and an url. 

    // to create a job, send a POST request to the /api/jobs route
    curl -d 'expression=* * * * * *&url=http://localhost:8888' http://localhost:9090/api/jobs
    // to list jobs, send a GET requst to the /api/jobs route
    curl http://localhost:9090/api/job
    // to update a job, send a PUT request to the /api/jobs/:id route
    curl -X PUT -d 'expression=* * * * * *&url=http://localhost:8888' http://localhost:9090/api/jobs/4fcd284b87cf3b5a07000004
    // to remove a job, send a DELETE request to the /api/jobs/:id route
    curl -X DELETE http://localhost:9090/api/jobs/4fcd284b87cf3b5a07000004

The job expression follows the cron pattern syntax described [here](http://help.sap.com/saphelp_xmii120/helpdata/en/44/89a17188cc6fb5e10000000a155369/content.htm).

Customization
-------------

The app is pre-configured to run on OpenShift.

LICENSE
-------

The code is free to use and distribute, under the [MIT license](https://raw.github.com/fzaninotto/cron-as-a-service/master/LICENSE).