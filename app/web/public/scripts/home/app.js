angular
    .module('CronAsAService', ['CronAsAService.controllers', 'CronAsAService.services'])
    .config(function($routeProvider) {
        $routeProvider
            .when('/jobs', {
                templateUrl: 'templates/jobs.html',
                controller: 'JobController',
            })
            .when('/newJob', {
                templateUrl: 'templates/newJob.html',
                controller: 'JobController',
            })
            .when('/newProject', {
                templateUrl: 'templates/newProject.html',
                controller: 'JobController',
            })
            .when('/contact', {
                templateUrl: 'templates/contact.html',
                controller: 'ContactController',
            })
            .when('/settings', {
                templateUrl: 'templates/settings.html',
                controller: 'SettingsController',
            })
            .when('/plan', {
                templateUrl: 'templates/plan.html',
                controller: 'PlanController',
            })
            .when('/docs', {
                templateUrl: 'templates/docs.html',
            })
            .otherwise({
                redirectTo: '/jobs',
            });
    })
    .directive('showtab', function() {
        return {
            link: function(scope, element, attrs) {
                element[0].onclick = function(event) {
                    event.preventDefault();
                    var activePanes = document.querySelectorAll('.active'),
                        activeTabs = document.querySelectorAll('.active');

                    // deactivate existing active tab and panel
                    for (var i = 0; i < activePanes.length; i++) {
                        activePanes[i].className = activePanes[i].className.replace('active', '');
                    }

                    for (var i = 0; i < activeTabs.length; i++) {
                        activeTabs[i].className = activeTabs[i].className.replace('activeTab', '');
                        activeTabs[i].className = activeTabs[i].className.replace('active', '');
                    }

                    // activate new tab and panel
                    event.target.parentElement.className += ' active';
                    event.target.parentElement.className += ' activeTab';
                    var matchingPanes = document.querySelectorAll('#' + event.target.href.split('#')[1]);
                    for (var i = 0; i < matchingPanes.length; i++) {
                        matchingPanes[i].className += ' active';
                    }
                };
            },
        };
    })
    .run(function($rootScope, has_password, plan, $location) {
        $rootScope.getHeaderAlert = function() {
            if (!has_password && !$rootScope.passwordSet) {
                return 'password';
            } else if (plan === 'free' && $location.path() != '/plan') {
                return 'upgrade';
            } else {
                return undefined;
            }
        };
    });
