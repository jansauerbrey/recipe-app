'use strict';

angular.module('recipeApp.schedules', ['ngRoute'])
  .config(['$routeProvider', function($routeProvider) {
    $routeProvider.when('/schedules', {
      templateUrl: 'partials/schedules.tpl.html',
      controller: 'SchedulesCtrl'
    });
  }])
  .controller('SchedulesCtrl', ['$scope', '$http', '$location', '$window', 'alertService',
    function($scope, $http, $location, $window, alertService) {
      $scope.schedules = [];
      $scope.loading = true;
      $scope.error = null;
      $scope.currentDate = new Date();
      $scope.selectedDays = [];
      $scope.selectedRecipes = [];

      // Load schedules
      $http.get('/api/schedules')
        .then(function(response) {
          $scope.schedules = response.data;
          $scope.loading = false;
        })
        .catch(function(error) {
          $scope.error = error.data?.error || 'Failed to load schedules';
          $scope.loading = false;
          alertService.error($scope.error);
        });

      $scope.addSchedule = function() {
        if ($scope.selectedDays.length === 0) {
          alertService.error('Please select at least one day');
          return;
        }

        if ($scope.selectedRecipes.length === 0) {
          alertService.error('Please select at least one recipe');
          return;
        }

        const schedule = {
          days: $scope.selectedDays,
          recipes: $scope.selectedRecipes,
        };

        $http.post('/api/schedules', schedule)
          .then(function(response) {
            $scope.schedules.push(response.data);
            $scope.selectedDays = [];
            $scope.selectedRecipes = [];
            alertService.success('Schedule added successfully');
          })
          .catch(function(error) {
            alertService.error(error.data?.error || 'Failed to add schedule');
          });
      };

      $scope.editSchedule = function(schedule) {
        $scope.selectedSchedule = angular.copy(schedule);
      };

      $scope.saveSchedule = function(schedule) {
        if (schedule.days.length === 0) {
          alertService.error('Please select at least one day');
          return;
        }

        if (schedule.recipes.length === 0) {
          alertService.error('Please select at least one recipe');
          return;
        }

        $http.put('/api/schedules/' + schedule._id, schedule)
          .then(function() {
            const index = $scope.schedules.findIndex(item => item._id === schedule._id);
            if (index !== -1) {
              $scope.schedules[index] = schedule;
            }
            $scope.selectedSchedule = null;
            alertService.success('Schedule updated successfully');
          })
          .catch(function(error) {
            alertService.error(error.data?.error || 'Failed to update schedule');
          });
      };

      $scope.deleteSchedule = function(schedule) {
        if (!confirm('Are you sure you want to delete this schedule?')) {
          return;
        }

        $http.delete('/api/schedules/' + schedule._id)
          .then(function() {
            $scope.schedules = $scope.schedules.filter(item => item._id !== schedule._id);
            alertService.success('Schedule deleted successfully');
          })
          .catch(function(error) {
            alertService.error(error.data?.error || 'Failed to delete schedule');
          });
      };

      $scope.toggleDay = function(day) {
        const index = $scope.selectedDays.indexOf(day);
        if (index === -1) {
          $scope.selectedDays.push(day);
        } else {
          $scope.selectedDays.splice(index, 1);
        }
      };

      $scope.isDaySelected = function(day) {
        return $scope.selectedDays.includes(day);
      };

      $scope.getWeekDays = function() {
        return ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      };

      $scope.formatDate = function(date) {
        return new Date(date).toLocaleDateString();
      };

      $scope.searchRecipes = function(query) {
        if (!query || query.length < 2) {
          return [];
        }

        return $http.get('/api/recipes/search', { params: { q: query } })
          .then(function(response) {
            return response.data;
          })
          .catch(function(error) {
            alertService.error(error.data?.error || 'Failed to search recipes');
            return [];
          });
      };

      $scope.addRecipe = function(recipe) {
        if (!recipe || $scope.selectedRecipes.some(r => r._id === recipe._id)) {
          return;
        }
        $scope.selectedRecipes.push(recipe);
      };

      $scope.removeRecipe = function(recipe) {
        const index = $scope.selectedRecipes.findIndex(r => r._id === recipe._id);
        if (index !== -1) {
          $scope.selectedRecipes.splice(index, 1);
        }
      };
    }
  ]);
