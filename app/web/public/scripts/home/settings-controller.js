angular.module('CronAsAService.controllers')
    .controller('SettingsController', function($scope, $routeParams,apiKey) {
        $scope.params = $routeParams;
        $scope.apiKey = apiKey;
    });