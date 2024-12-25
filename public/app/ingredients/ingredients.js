'use strict';

angular.module('recipeApp.ingredients', ['ngRoute'])
  .config(['$routeProvider', function($routeProvider) {
    $routeProvider.when('/ingredients', {
      templateUrl: 'partials/ingredients.tpl.html',
      controller: 'IngredientsCtrl'
    });
  }])
  .controller('IngredientsCtrl', ['$scope', '$http', '$location', 'alertService',
    function($scope, $http, $location, alertService) {
      $scope.ingredients = [];
      $scope.order = 'name';
      $scope.reverse = false;
      $scope.loading = true;
      $scope.error = null;

      // Load ingredients
      $http.get('/api/ingredients')
        .then(function(response) {
          $scope.ingredients = response.data;
          $scope.loading = false;
        })
        .catch(function(error) {
          $scope.error = error.data?.error || 'Failed to load ingredients';
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

      $scope.addIngredient = function() {
        if (!$scope.newIngredient?.name) {
          alertService.error('Name is required');
          return;
        }

        $http.post('/api/ingredients', $scope.newIngredient)
          .then(function(response) {
            $scope.ingredients.push(response.data);
            $scope.newIngredient = {};
            alertService.success('Ingredient added successfully');
          })
          .catch(function(error) {
            alertService.error(error.data?.error || 'Failed to add ingredient');
          });
      };

      $scope.editIngredient = function(ingredient) {
        $scope.selectedIngredient = angular.copy(ingredient);
      };

      $scope.saveIngredient = function(ingredient) {
        if (!ingredient.name) {
          alertService.error('Name is required');
          return;
        }

        $http.put('/api/ingredients/' + ingredient._id, ingredient)
          .then(function() {
            const index = $scope.ingredients.findIndex(item => item._id === ingredient._id);
            if (index !== -1) {
              $scope.ingredients[index] = ingredient;
            }
            $scope.selectedIngredient = null;
            alertService.success('Ingredient updated successfully');
          })
          .catch(function(error) {
            alertService.error(error.data?.error || 'Failed to update ingredient');
          });
      };

      $scope.deleteIngredient = function(ingredient) {
        if (!confirm('Are you sure you want to delete this ingredient?')) {
          return;
        }

        $http.delete('/api/ingredients/' + ingredient._id)
          .then(function() {
            $scope.ingredients = $scope.ingredients.filter(item => item._id !== ingredient._id);
            alertService.success('Ingredient deleted successfully');
          })
          .catch(function(error) {
            alertService.error(error.data?.error || 'Failed to delete ingredient');
          });
      };
    }
  ]);
