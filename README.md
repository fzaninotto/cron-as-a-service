[![build status](https://secure.travis-ci.org/fzaninotto/cron-as-a-service.png)](http://travis-ci.org/fzaninotto/cron-as-a-service)
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

    > node app

Head to the API root for a list of available resources:

    http://localhost:8082/api/
    
Jobs CRUD
---------

A job is composed of an expression and an url. 

    // to create a job, send a POST request to the /api/jobs route
    curl -d 'expression=* * * * * *&url=http://localhost:8888' http://localhost:8082/api/jobs
    // to list jobs, send a GET requst to the /api/jobs route
    curl http://localhost:8082/api/job
    // to update a job, send a PUT request to the /api/jobs/:id route
    curl -X PUT -d 'expression=* * * * * *&url=http://localhost:8888' http://localhost:8082/api/jobs/4fcd284b87cf3b5a07000004
    // to remove a job, send a DELETE request to the /api/jobs/:id route
    curl -X DELETE http://localhost:8082/api/jobs/4fcd284b87cf3b5a07000004

The job expression follows the cron pattern syntax described [here](http://help.sap.com/saphelp_xmii120/helpdata/en/44/89a17188cc6fb5e10000000a155369/content.htm).

**Tip**: You can start the provided dummy target to test the job polling:

    > node fixtures/dummyTarget.js

Customization
-------------

Uptime uses [node-config](https://github.com/lorenwest/node-config) to allow YAML configuration and environment support. Here is the default configuration, taken from `config/default.yaml`:

    mongodb:
      server:   localhost
      database: cron
      user:     root 
      password:
    
    server:
      port:     8082

To modify this configuration, create a `development.yaml` or a `production.yaml` file in the same directory, and override just the settings you need. For instance, to run the service on port 80 in production, create a `production.yaml` file as follows:

    server:
      port:     80

LICENSE
-------

The code is free to use and distribute, under the [MIT license](https://raw.github.com/fzaninotto/cron-as-a-service/master/LICENSE).

TODO
----

* Web GUI
* Record response status for each executed job
* Run jobs in a separate process
* Deal with web proxies