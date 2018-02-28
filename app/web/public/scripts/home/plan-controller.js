angular.module('CronAsAService.controllers')
    .controller('PlanController', function ($scope, $routeParams, email, currency_symbol, price_month, price_year, plan, stripe) {
        $scope.price_month = price_month;
        $scope.price_year = price_year;
        $scope.email = email;
        $scope.upgrade_plan = plan;
        $scope.coupon = null;

        $scope.upgrade = function (plan) {
            var amount;

            if (plan === 'monthly') {
                amount = $scope.price_month;
                $scope.upgrade_plan = 'monthly';
            } else if (plan === 'yearly') {
                amount = $scope.price_year;
                $scope.upgrade_plan = 'yearly';
            } else {
                return;
            }

            if ($scope.coupon === 'WELCOME10') {
                amount = (amount * 0.9).toFixed(2);
            }

            handler.open({
                name: 'Cron As A Service',
                description: plan + ' plan at ' + currency_symbol + amount,
                email: $scope.email,
                amount: parseFloat(amount) * 100
            });

            ga('send', 'event', 'user', 'upgrade', plan, amount);
        };
    });