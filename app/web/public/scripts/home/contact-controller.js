angular.module('CronAsAService.controllers')
    .controller('ContactController', function($scope, $routeParams, email) {
        $scope.params = $routeParams;
        $scope.email = email;
    });