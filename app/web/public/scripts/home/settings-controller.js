angular.module('CronAsAService.controllers')
    .controller('SettingsController', ['ngRoute','$scope', '$routeParams'], function($scope, $routeParams) {
        $scope.params = $routeParams;
    });