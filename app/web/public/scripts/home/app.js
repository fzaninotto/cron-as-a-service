angular.module('CronAsAService', [
        'CronAsAService.controllers',
        'CronAsAService.services'
    ])
    .config(function($routeProvider) {
            $routeProvider.
              when('/jobs', {
                templateUrl: 'templates/jobs.html',
                controller: 'JobController'
              }).
              when('/newJob', {
                templateUrl: 'templates/newJob.html',
                controller: 'JobController'
              }).
              when('/contact', {
                templateUrl: 'templates/contact.html',
                controller: 'ContactController'
              }).
              when('/settings', {
                templateUrl: 'templates/settings.html',
                controller: 'SettingsController'
              }).
              otherwise({
                redirectTo: '/jobs'
              });
          }); 