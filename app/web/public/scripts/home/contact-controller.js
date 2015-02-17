angular.module('CronAsAService.controllers')
    .controller('ContactController', ['ngRoute'], function($scope, $routeParams) {
        $scope.params = $routeParams;
    });