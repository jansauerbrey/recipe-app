'use strict';

angular.module('recipeApp.dishtypes', ['ngRoute'])
  .config(['$routeProvider', function($routeProvider) {
    $routeProvider.when('/dishtypes', {
      templateUrl: 'partials/dishtypes.tpl.html',
      controller: 'DishTypesCtrl'
    });
  }])
  .controller('DishTypesCtrl', ['$scope', '$http', '$location', 'alertService',
    function($scope, $http, $location, alertService) {
      $scope.dishTypes = [];
      $scope.order = 'name';
      $scope.reverse = false;
      $scope.loading = true;
      $scope.error = null;

      // Load dish types
      $http.get('/api/dishtypes')
        .then(function(response) {
          $scope.dishTypes = response.data;
          $scope.loading = false;
        })
        .catch(function(error) {
          $scope.error = error.data?.error || 'Failed to load dish types';
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

      $scope.addDishType = function() {
        if (!$scope.newDishType?.name) {
          alertService.error('Name is required');
          return;
        }

        $http.post('/api/dishtypes', $scope.newDishType)
          .then(function(response) {
            $scope.dishTypes.push(response.data);
            $scope.newDishType = {};
            alertService.success('Dish type added successfully');
          })
          .catch(function(error) {
            alertService.error(error.data?.error || 'Failed to add dish type');
          });
      };

      $scope.editDishType = function(dishType) {
        $scope.selectedDishType = angular.copy(dishType);
      };

      $scope.saveDishType = function(dishType) {
        if (!dishType.name) {
          alertService.error('Name is required');
          return;
        }

        $http.put('/api/dishtypes/' + dishType._id, dishType)
          .then(function() {
            const index = $scope.dishTypes.findIndex(item => item._id === dishType._id);
            if (index !== -1) {
              $scope.dishTypes[index] = dishType;
            }
            $scope.selectedDishType = null;
            alertService.success('Dish type updated successfully');
          })
          .catch(function(error) {
            alertService.error(error.data?.error || 'Failed to update dish type');
          });
      };

      $scope.deleteDishType = function(dishType) {
        if (!confirm('Are you sure you want to delete this dish type?')) {
          return;
        }

        $http.delete('/api/dishtypes/' + dishType._id)
          .then(function() {
            $scope.dishTypes = $scope.dishTypes.filter(item => item._id !== dishType._id);
            alertService.success('Dish type deleted successfully');
          })
          .catch(function(error) {
            alertService.error(error.data?.error || 'Failed to delete dish type');
          });
      };
    }
  ]);
