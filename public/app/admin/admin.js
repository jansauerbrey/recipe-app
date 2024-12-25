'use strict';

angular.module('recipeApp.admin', ['ngRoute'])
  .config(['$routeProvider', function($routeProvider) {
    $routeProvider.when('/admin', {
      templateUrl: 'partials/admin.user.tpl.html',
      controller: 'AdminCtrl'
    });
  }])
  .controller('AdminCtrl', ['$scope', '$http', '$location', 'alertService',
    function($scope, $http, $location, alertService) {
      $scope.users = [];
      $scope.order = 'username';
      $scope.reverse = false;
      $scope.loading = true;
      $scope.error = null;

      // Load users
      $http.get('/api/admin/users')
        .then(function(response) {
          $scope.users = response.data;
          $scope.loading = false;
        })
        .catch(function(error) {
          $scope.error = error.data?.error || 'Failed to load users';
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

      $scope.editUser = function(user) {
        $scope.selectedUser = angular.copy(user);
      };

      $scope.saveUser = function(user) {
        if (!user.username) {
          alertService.error('Username is required');
          return;
        }

        $http.put('/api/admin/users/' + user._id, user)
          .then(function() {
            const index = $scope.users.findIndex(item => item._id === user._id);
            if (index !== -1) {
              $scope.users[index] = user;
            }
            $scope.selectedUser = null;
            alertService.success('User updated successfully');
          })
          .catch(function(error) {
            alertService.error(error.data?.error || 'Failed to update user');
          });
      };

      $scope.deleteUser = function(user) {
        if (!confirm('Are you sure you want to delete this user?')) {
          return;
        }

        $http.delete('/api/admin/users/' + user._id)
          .then(function() {
            $scope.users = $scope.users.filter(item => item._id !== user._id);
            alertService.success('User deleted successfully');
          })
          .catch(function(error) {
            alertService.error(error.data?.error || 'Failed to delete user');
          });
      };
    }
  ]);
