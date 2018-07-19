angular
    .module('CronAsAService.controllers')
    .controller('JobController', function($scope, $location, $routeParams, apiService, utils, plan, email) {
        var defaultAlarmForm = {
            statusCode: null,
            jsonPath: null,
            jsonPathResult: null,
        };

        $scope.location = $location;
        $scope.cronList = [];
        $scope.projects;
        $scope.project;
        $scope.formData = {
            headers: [],
            params: [],
            method: 'get',
        };
        $scope.projectForm = {
            users: [],
        };
        $scope.newJobAlerts = [];
        $scope.jobAlerts = [];
        $scope.plan = plan;
        $scope.email = email;
        $scope.showAdvanced = false;

        $scope.$watch('formData.requestBody', function() {
            try {
                $scope.formData.requestBody = angular.toJson(JSON.parse($scope.formData.requestBody), true);
            } catch (exp) {
                //Exception handler
            }
        });

        var fixRequestBody = function(body) {
            return body ? $body.replace('\n', '') : null;
        };

        //new cron job
        $scope.newJob = function() {
            $scope.newJobAlerts = [];
            $scope.formData.requestBody = fixRequestBody($scope.formData.requestBody);
            $scope.formData.project = $scope.project.id;
            apiService
                .newJob($scope.formData)
                .success(function(data) {
                    $scope.formData = {
                        headers: [],
                        params: [],
                        method: 'get',
                    }; //blank out the form

                    //reload the cron list
                    $scope.refreshList();
                    $location.path('/jobs').search({ projectId: $scope.project.id });
                })
                .error(function(data, status, headers, config) {
                    $scope.newJobAlerts.push({
                        type: 'error',
                        msg: data.error || data.substr(0, data.indexOf('<br>')),
                    });
                });
        };

        //new project
        $scope.newProject = function() {
            $scope.newJobAlerts = [];

            apiService
                .newProject($scope.projectForm)
                .success(function(data) {
                    $scope.projectForm = {
                        users: [],
                    }; //blank out the form

                    //reload the cron list
                    $scope.refreshProjects();
                    $location.path('/jobs').search({ projectId: data._id });
                })
                .error(function(data, status, headers, config) {
                    $scope.newProjectAlerts.push({
                        type: 'error',
                        msg: data.error || data.substr(0, data.indexOf('<br>')),
                    });
                });
        };

        //disable job
        $scope.disable = function(job) {
            $scope.jobAlerts = [];
            if (confirm('Are you sure you wish to disable this job? It will no longer run.')) {
                job.status = 'disabled';
                apiService
                    .saveJob(job)
                    .success(function(data) {
                        $scope.refreshList();
                    })
                    .error(function(data, status, headers, config) {
                        $scope.jobAlerts.push({ type: 'error', msg: data || status });
                    });
            }
        };

        $scope.enable = function(job) {
            $scope.jobAlerts = [];
            job.status = 'active';
            apiService
                .saveJob(job)
                .success(function(data) {
                    $scope.refreshList();
                })
                .error(function(data, status, headers, config) {
                    $scope.jobAlerts.push({ type: 'error', msg: data || status });
                });
        };

        //delete job
        $scope.remove = function(id) {
            $scope.jobAlerts = [];
            if (confirm('Are you sure you wish to delete this job?')) {
                apiService
                    .delete(id)
                    .success(function(data) {
                        $scope.refreshList();
                    })
                    .error(function(data, status, headers, config) {
                        $scope.jobAlerts.push({ type: 'error', msg: data || status });
                    });
            }
        };

        //Save an edited job
        $scope.saveJob = function(job) {
            $scope.jobAlerts = [];
            apiService
                .saveJob(job)
                .success(function(data) {
                    $scope.refreshList();
                })
                .error(function(data, status, headers, config) {
                    $scope.jobAlerts.push({ type: 'error', msg: data || status });
                });
        };

        $scope.createAlarm = function(job) {
            job.alarmAlerts = [];
            apiService
                .createAlarm(job)
                .success(function(data) {
                    job.alarmFormData = defaultAlarmForm;

                    $scope.refreshList();
                })
                .error(function(data, status, headers, config) {
                    job.alarmAlerts.push({ type: 'error', msg: data.error });
                });
        };

        //when a chart is created
        $scope.$on('create', function(event, chart) {
            chart.datasets[0].bars.forEach(function(bar) {
                if (bar.value != 200) {
                    bar.fillColor = 'rgb(180,100,100)';
                    bar.strokeColor = 'rgb(180,100,100)';
                }
            });
        });

        //refresh the jobs list
        $scope.refreshList = function() {
            apiService.getJobs($scope.project.id).success(function(response) {
                response.forEach(function(job) {
                    job.nextRun = new Date(job.nextRun);
                    job.responseStatuses.reverse();
                    job.responseDates.reverse();
                    job.graphData = [job.responseStatuses];
                    var graphColours = [];
                    for (var i = 0; i < job.responseStatuses.length; i++) {
                        var graphColor = {
                            // good = green
                            fillColor: 'rgba(70,191,189,0.2)',
                            strokeColor: 'rgba(70,191,189,1)',
                            pointColor: 'rgba(70,191,189,1)',
                            pointStrokeColor: '#fff',
                            pointHighlightFill: '#fff',
                            pointHighlightStroke: 'rgba(70,191,189,0.8)',
                        };

                        if (job.responseStatuses[i] != 200) {
                            // error
                            job.responseStatuses[i] = -job.responseStatuses[i];
                        }

                        graphColours.push(graphColor);
                    }
                    job.graphColours = graphColours;

                    job.options = {
                        barShowLabels: false,
                        scaleShowLabels: false,
                        barBeginAtOrigin: false,
                        barStrokeWidth: 1,
                        barValueSpacing: 1,
                        scaleShowGridLines: false,
                        showScale: true,
                    };

                    job.showAlarms = job.alarms && job.alarms.length > 0;
                    job.alarmFormData = defaultAlarmForm;
                    job.alarmAlerts = [];
                });
                $scope.cronList = response;
            });
        };

        $scope.refreshProjects = function() {
            apiService.getProjects().success(response => {
                $scope.projects = response;
                if ($scope.projects.length > 0) {
                    $scope.project = { id: $routeParams.projectId || $scope.projects[0]._id };
                    $scope.refreshList();
                }
            });
        };

        $scope.refreshProjects();

        $scope.addHeader = function() {
            $scope.formData.headers.push({ header: 'value' });
        };

        $scope.addParam = function() {
            $scope.formData.params.push({ parameter: 'value' });
        };

        $scope.addAuthorizedUser = function() {
            $scope.projectForm.users.push('');
        };

        $scope.closeAlert = function(index) {
            $scope.alerts.splice(index, 1);
        };

        //tour
        $scope.currentStep = 0;

        //tour complete
        $scope.postTour = function() {
            apiService.tourComplete();
        };
    });
