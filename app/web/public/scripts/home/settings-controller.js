angular.module('CronAsAService.controllers')
    .controller('SettingsController', function($scope, $routeParams,apiService,apiKey,email,name,invoice_email) {
        $scope.params = $routeParams;
        $scope.apiKey = apiKey;
        $scope.email = email;
        $scope.userAlerts = [];
        $scope.user = {
            name: name,
            invoice_email: invoice_email
        };
    
        $scope.updateUser = function(){
            $scope.userAlerts = [];
            
            if($scope.user.password && !($scope.user.password===$scope.user.confirmPassword)){
                $scope.userAlerts.push({class:'alert alert-danger' , msg: 'Sorry, the passwords do not match, try typing them again.'}); 
                return;
            }
            
            apiService.updateUser({
                                    user:$scope.user
                                  })
            .success(function(data) {
                $scope.userAlerts.push({class:'alert alert-success' , msg: 'Your account has been updated'}); 
            }).error(function(data, status, headers, config) {
                $scope.userAlerts.push({class:'alert alert-danger' , msg: data ? data.substr(0 , data.indexOf('<br>')) : 'Something went wrong updating your account.'});    
            });
        };
    });