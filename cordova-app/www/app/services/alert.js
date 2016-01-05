angular.module('app.alert', [])

// Alert Service

    .factory('AlertService', function() {
        var service = {
            add: add,
            closeAlert: closeAlert,
            closeAlertIdx: closeAlertIdx,
            clear: clear,
            get: get
        },
        alerts = [];

        return service;

        function add(type, msg) {
            return alerts.push({
                type: type,
                msg: msg,
                close: function() {
                    return closeAlert(this);
                }
            });
        }

        function closeAlert(alert) {
            return closeAlertIdx(alerts.indexOf(alert));
        }

        function closeAlertIdx(index) {
            return alerts.splice(index, 1);
        }

        function clear(){
            alerts = [];
        }

        function get() {
            return alerts;
        }
    })




//---------------
// Controllers
//---------------


// Alerts

    .controller('AlertController', ['$scope', 'AlertService', function ($scope, AlertService) {
     
      $scope.alerts = AlertService.get();
      AlertService.add('success', 'AlertService was started');

    }])


;
