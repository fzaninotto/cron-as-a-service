angular.module('CronAsAService.controllers')
    .controller('SettingsController', function($scope, $routeParams,apiKey,email) {
        $scope.params = $routeParams;
        $scope.apiKey = apiKey;
        $scope.email = email;
    });