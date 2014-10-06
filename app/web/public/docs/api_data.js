define({ api: [
  {
    "type": "get",
    "url": "/",
    "title": "List possible API calls",
    "version": "0.9.0",
    "name": "ListCalls",
    "group": "Api",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "field": "apikey",
            "optional": false,
            "description": "<p>Api Key.</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "String",
            "field": "method",
            "optional": false,
            "description": "<p>Http method for this api call</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "field": "path",
            "optional": false,
            "description": "<p>URL to call this api</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Success-Response:",
          "content": "Success-Response:\n   HTTP/1.1 200 OK\n   [{\n     \"method\": \"get\",\n     \"path\": \"/jobs\"\n   }]\n",
          "type": "json"
        }
      ]
    },
    "error": {
      "fields": {
        "Error 4xx": [
          {
            "group": "Error 4xx",
            "field": "NotAuthenticatedError",
            "optional": false,
            "description": "<p>The apikey is incorrect or no apikey is provided</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Error-Response:",
          "content": "Error-Response:\n   HTTP/1.1 404 Not Found\n   {\n     \"error\": \"You must provide a valid api key. Visit crontabasaservice.com to register.\"\n   }\n",
          "type": "json"
        }
      ]
    },
    "filename": "app/api/index.js"
  },
  {
    "type": "post",
    "url": "/jobs",
    "title": "Create a new job",
    "version": "0.9.0",
    "name": "CreateJob",
    "group": "Jobs",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "field": "apikey",
            "optional": false,
            "description": "<p>Api Key.</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "field": "expression",
            "optional": false,
            "description": "<p>Cron expression.</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "field": "url",
            "optional": false,
            "description": "<p>URL to request.</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "String",
            "field": "expression",
            "optional": false,
            "description": "<p>Cron Expression</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "field": "url",
            "optional": false,
            "description": "<p>URL to request</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Success-Response:",
          "content": "Success-Response:\n   HTTP/1.1 200 OK\n   {\n     \"expression\": \"* * * *\",\n     \"lastname\": \"http://www.example.com\"\n   }\n",
          "type": "json"
        }
      ]
    },
    "error": {
      "fields": {
        "Error 4xx": [
          {
            "group": "Error 4xx",
            "field": "NotAuthenticatedError",
            "optional": false,
            "description": "<p>The apikey is incorrect or no apikey is provided</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Error-Response:",
          "content": "Error-Response:\n   HTTP/1.1 404 Not Found\n   {\n     \"error\": \"You must provide a valid api key. Visit crontabasaservice.com to register.\"\n   }\n",
          "type": "json"
        }
      ]
    },
    "filename": "app/api/index.js"
  },
  {
    "type": "delete",
    "url": "/jobs",
    "title": "Delete a Job by id",
    "version": "0.9.0",
    "name": "DeleteJob",
    "group": "Jobs",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "field": "apikey",
            "optional": false,
            "description": "<p>Api Key.</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "field": "id",
            "optional": false,
            "description": "<p>ID for the job.</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "String",
            "field": "response",
            "optional": false,
            "description": "<p>Response message</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Success-Response:",
          "content": "Success-Response:\n   HTTP/1.1 200 OK\n   {\n     \"response\": \"deleted\"\n   }\n",
          "type": "json"
        }
      ]
    },
    "error": {
      "fields": {
        "Error 4xx": [
          {
            "group": "Error 4xx",
            "field": "NotAuthenticatedError",
            "optional": false,
            "description": "<p>The apikey is incorrect or no apikey is provided</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Error-Response:",
          "content": "Error-Response:\n   HTTP/1.1 404 Not Found\n   {\n     \"error\": \"You must provide a valid api key. Visit crontabasaservice.com to register.\"\n   }\n",
          "type": "json"
        }
      ]
    },
    "filename": "app/api/index.js"
  },
  {
    "type": "put",
    "url": "/jobs",
    "title": "Edit an existing Job",
    "version": "0.9.0",
    "name": "EditJob",
    "group": "Jobs",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "field": "apikey",
            "optional": false,
            "description": "<p>Api Key.</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "field": "id",
            "optional": false,
            "description": "<p>ID for the job.</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "field": "expression",
            "optional": false,
            "description": "<p>Cron expression.</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "field": "url",
            "optional": false,
            "description": "<p>URL to request.</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "String",
            "field": "expression",
            "optional": false,
            "description": "<p>Cron Expression</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "field": "url",
            "optional": false,
            "description": "<p>URL to request</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Success-Response:",
          "content": "Success-Response:\n   HTTP/1.1 200 OK\n   {\n     \"expression\": \"* * * *\",\n     \"lastname\": \"http://www.example.com\"\n   }\n",
          "type": "json"
        }
      ]
    },
    "error": {
      "fields": {
        "Error 4xx": [
          {
            "group": "Error 4xx",
            "field": "NotAuthenticatedError",
            "optional": false,
            "description": "<p>The apikey is incorrect or no apikey is provided</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Error-Response:",
          "content": "Error-Response:\n   HTTP/1.1 404 Not Found\n   {\n     \"error\": \"You must provide a valid api key. Visit crontabasaservice.com to register.\"\n   }\n",
          "type": "json"
        }
      ]
    },
    "filename": "app/api/index.js"
  },
  {
    "type": "get",
    "url": "/jobs",
    "title": "Get a Job by id",
    "version": "0.9.0",
    "name": "GetJob",
    "group": "Jobs",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "field": "apikey",
            "optional": false,
            "description": "<p>Api Key.</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "field": "id",
            "optional": false,
            "description": "<p>ID for the job.</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "String",
            "field": "expression",
            "optional": false,
            "description": "<p>Cron Expression</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "field": "url",
            "optional": false,
            "description": "<p>URL to request</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Success-Response:",
          "content": "Success-Response:\n   HTTP/1.1 200 OK\n   {\n     \"expression\": \"* * * *\",\n     \"lastname\": \"http://www.example.com\"\n   }\n",
          "type": "json"
        }
      ]
    },
    "error": {
      "fields": {
        "Error 4xx": [
          {
            "group": "Error 4xx",
            "field": "NotAuthenticatedError",
            "optional": false,
            "description": "<p>The apikey is incorrect or no apikey is provided</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Error-Response:",
          "content": "Error-Response:\n   HTTP/1.1 404 Not Found\n   {\n     \"error\": \"You must provide a valid api key. Visit crontabasaservice.com to register.\"\n   }\n",
          "type": "json"
        }
      ]
    },
    "filename": "app/api/index.js"
  },
  {
    "type": "get",
    "url": "/jobs",
    "title": "Get all Jobs for the authenticated user",
    "version": "0.9.0",
    "name": "GetJobs",
    "group": "Jobs",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "field": "apikey",
            "optional": false,
            "description": "<p>Api Key.</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "String",
            "field": "expression",
            "optional": false,
            "description": "<p>Cron Expression</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "field": "url",
            "optional": false,
            "description": "<p>URL to request</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Success-Response:",
          "content": "Success-Response:\n   HTTP/1.1 200 OK\n   [{\n     \"expression\": \"* * * *\",\n     \"lastname\": \"http://www.example.com\"\n   }]\n",
          "type": "json"
        }
      ]
    },
    "error": {
      "fields": {
        "Error 4xx": [
          {
            "group": "Error 4xx",
            "field": "NotAuthenticatedError",
            "optional": false,
            "description": "<p>The apikey is incorrect or no apikey is provided</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Error-Response:",
          "content": "Error-Response:\n   HTTP/1.1 404 Not Found\n   {\n     \"error\": \"You must provide a valid api key. Visit crontabasaservice.com to register.\"\n   }\n",
          "type": "json"
        }
      ]
    },
    "filename": "app/api/index.js"
  }
] });