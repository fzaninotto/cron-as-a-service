angular.module('CronAsAService.controllers')
    .controller('JobController', function ($scope, $location, apiService, utils, plan, email) {
        var defaultAlarmForm = {
            statusCode: null,
            jsonPath: null,
            jsonPathResult: null
        };

        $scope.location = $location;
        $scope.cronList = [];
        $scope.formData = {
            headers: [],
            params: [],
            method: 'get'
        };
        $scope.newJobAlerts = [];
        $scope.jobAlerts = [];
        $scope.plan = plan;
        $scope.email = email;
        $scope.showAdvanced = false;

        $scope.$watch('formData.requestBody', function () {
            try {
                $scope.formData.requestBody = angular.toJson(JSON.parse($scope.formData.requestBody), true);
            } catch (exp) {
                //Exception handler
            };
        });

        //new cron job
        $scope.newJob = function () {
            $scope.newJobAlerts = [];
            $scope.formData.requestBody = $scope.formData.requestBody ? $scope.formData.requestBody.replace('\n', '') : null;
            apiService.newJob($scope.formData).success(function (data) {
                $scope.formData = {};//blank out the form

                //reload the cron list
                $scope.refreshList();
                $location.path('/jobs');
            }).error(function (data, status, headers, config) {
                $scope.newJobAlerts.push({ type: 'error', msg: data.error || data.substr(0, data.indexOf('<br>')) });
            });
        };

        //delete job
        $scope.remove = function (id) {
            $scope.jobAlerts = [];
            if (confirm('Are you sure you wish to delete this job?')) {
                apiService.delete(id).success(function (data) {
                    $scope.refreshList();
                }).error(function (data, status, headers, config) {
                    $scope.jobAlerts.push({ type: 'error', msg: data || status });
                });
            }
        }

        //Save an edited job
        $scope.saveJob = function (job) {
            $scope.jobAlerts = [];
            apiService.saveJob(job).success(function (data) {
                $scope.refreshList();
            }).error(function (data, status, headers, config) {
                $scope.jobAlerts.push({ type: 'error', msg: data || status });
            });
        };

        $scope.createAlarm = function (job) {
            job.alarmAlerts = [];
            apiService.createAlarm(job)
                .success(function (data) {
                    job.alarmFormData = defaultAlarmForm;

                    $scope.refreshList();
                })
                .error(function (data, status, headers, config) {
                    job.alarmAlerts.push({ type: 'error', msg: data.error });
                });
        };

        //when a chart is created
        $scope.$on('create', function (event, chart) {
            chart.datasets[0].bars.forEach(function (bar) {
                if (bar.value != 200) {
                    bar.fillColor = "rgb(180,100,100)";
                    bar.strokeColor = "rgb(180,100,100)";
                }
            });
        });

        //refresh the jobs list
        $scope.refreshList = function () {
            apiService.getJobs().success(function (response) {
                response.forEach(function (job) {
                    job.nextRun = new Date(job.nextRun);
                    job.responseStatuses.reverse();
                    job.responseDates.reverse();
                    job.graphData = [job.responseStatuses];
                    var graphColours = [];
                    for (var i = 0; i < job.responseStatuses.length; i++) {
                        var graphColor = { // good = green
                            fillColor: 'rgba(70,191,189,0.2)',
                            strokeColor: 'rgba(70,191,189,1)',
                            pointColor: 'rgba(70,191,189,1)',
                            pointStrokeColor: '#fff',
                            pointHighlightFill: '#fff',
                            pointHighlightStroke: 'rgba(70,191,189,0.8)'
                        };

                        if (job.responseStatuses[i] != 200) {// error                                
                            job.responseStatuses[i] = - job.responseStatuses[i];
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
                        showScale: true
                    };

                    job.showAlarms = job.alarms && job.alarms.length > 0;
                    job.alarmFormData = defaultAlarmForm;
                    job.alarmAlerts = [];
                });
                $scope.cronList = response;
            });
        };

        $scope.addHeader = function () {
            $scope.formData.headers.push({ 'header': 'value' });
        };

        $scope.addParam = function () {
            $scope.formData.params.push({ 'parameter': 'value' });
        };

        $scope.closeAlert = function (index) {
            $scope.alerts.splice(index, 1);
        };

        $scope.refreshList();

        //tour
        $scope.currentStep = 0;

        //tour complete
        $scope.postTour = function () {
            apiService.tourComplete();
        };
    });