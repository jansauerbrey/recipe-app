'use strict';

angular.module('recipeApp.units', ['ngRoute'])
  .config(['$routeProvider', function($routeProvider) {
    $routeProvider.when('/units', {
      templateUrl: 'partials/units.tpl.html',
      controller: 'UnitsCtrl'
    });
  }])
  .controller('UnitsCtrl', ['$scope', '$http', '$location', 'alertService',
    function($scope, $http, $location, alertService) {
      $scope.units = [];
      $scope.order = 'name';
      $scope.reverse = false;
      $scope.loading = true;
      $scope.error = null;

      // Load units
      $http.get('/api/units')
        .then(function(response) {
          $scope.units = response.data;
          $scope.loading = false;
        })
        .catch(function(error) {
          $scope.error = error.data?.error || 'Failed to load units';
          $scope.loading = false;
          alertService.error($scope.error);
        });

      $scope.setOrder = function(order) {
        if ($scope.order === order) {
          $scope.reverse = !$scope.reverse;
        } else {
          $scope.order = order;
          $scope.reverse = false;
        }
      };

      $scope.addUnit = function() {
        if (!$scope.newUnit?.name) {
          alertService.error('Name is required');
          return;
        }

        $http.post('/api/units', $scope.newUnit)
          .then(function(response) {
            $scope.units.push(response.data);
            $scope.newUnit = {};
            alertService.success('Unit added successfully');
          })
          .catch(function(error) {
            alertService.error(error.data?.error || 'Failed to add unit');
          });
      };

      $scope.editUnit = function(unit) {
        $scope.selectedUnit = angular.copy(unit);
      };

      $scope.saveUnit = function(unit) {
        if (!unit.name) {
          alertService.error('Name is required');
          return;
        }

        $http.put('/api/units/' + unit._id, unit)
          .then(function() {
            const index = $scope.units.findIndex(item => item._id === unit._id);
            if (index !== -1) {
              $scope.units[index] = unit;
            }
            $scope.selectedUnit = null;
            alertService.success('Unit updated successfully');
          })
          .catch(function(error) {
            alertService.error(error.data?.error || 'Failed to update unit');
          });
      };

      $scope.deleteUnit = function(unit) {
        if (!confirm('Are you sure you want to delete this unit?')) {
          return;
        }

        $http.delete('/api/units/' + unit._id)
          .then(function() {
            $scope.units = $scope.units.filter(item => item._id !== unit._id);
            alertService.success('Unit deleted successfully');
          })
          .catch(function(error) {
            alertService.error(error.data?.error || 'Failed to delete unit');
          });
      };
    }
  ]);
