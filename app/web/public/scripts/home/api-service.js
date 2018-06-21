angular
    .module('CronAsAService.services', [])
    .factory('apiService', function($http, apiKey) {
        var API = {};

        API.getJobs = function(projectId) {
            return $http({
                method: 'GET',
                url: '/api/projects/' + projectId + '/jobs?apikey=' + apiKey,
            });
        };

        API.getProjects = function() {
            return $http({
                method: 'GET',
                url: '/api/projects?apikey=' + apiKey,
            });
        };

        API.newProject = function(formData) {
            return $http({
                method: 'POST',
                url: '/api/projects?apikey=' + apiKey,
                data: formData,
                headers: { 'Content-Type': 'application/json' },
            });
        };

        API.newJob = function(formData) {
            return $http({
                method: 'POST',
                url: '/api/jobs?apikey=' + apiKey,
                data: formData,
                headers: { 'Content-Type': 'application/json' },
            });
        };

        API.delete = function(id) {
            return $http({
                method: 'DELETE',
                url: '/api/jobs/' + id + '?apikey=' + apiKey,
                headers: { 'Content-Type': 'application/json' },
            });
        };

        API.saveJob = function(job) {
            return $http({
                method: 'PUT',
                url: '/api/jobs/' + job.id + '?apikey=' + apiKey,
                data: job,
                headers: { 'Content-Type': 'application/json' },
            });
        };

        API.createAlarm = function(job) {
            return $http({
                method: 'POST',
                url: '/api/jobs/' + job._id + '/alarms?apikey=' + apiKey,
                data: job.alarmFormData,
                headers: { 'Content-Type': 'application/json' },
            });
        };

        API.updateUser = function(user) {
            return $http({
                method: 'POST',
                url: '/user/update?apikey=' + apiKey,
                data: user,
                headers: { 'Content-Type': 'application/json' },
            });
        };

        API.tourComplete = function() {
            return $http({
                method: 'POST',
                url: '/tourcomplete',
                headers: { 'Content-Type': 'application/json' },
            });
        };

        return API;
    })
    .factory('utils', function() {
        var UTILS = {};

        UTILS.readCookie = function(name) {
            var nameEQ = name + '=';
            var ca = document.cookie.split(';');
            for (var i = 0; i < ca.length; i++) {
                var c = ca[i];
                while (c.charAt(0) === ' ') {
                    c = c.substring(1, c.length);
                }
                if (c.indexOf(nameEQ) === 0) {
                    return c.substring(nameEQ.length, c.length);
                }
            }
            return null;
        };

        UTILS.createCookie = function(name, value, days) {
            var expires;
            if (days) {
                var date = new Date();
                date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
                expires = '; expires=' + date.toGMTString();
            } else {
                expires = '';
            }
            document.cookie = name + '=' + value + expires + '; path=/';
        };

        return UTILS;
    });
