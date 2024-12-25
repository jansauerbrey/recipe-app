'use strict';

angular.module('recipeApp.tags', ['ngRoute'])
  .config(['$routeProvider', function($routeProvider) {
    $routeProvider.when('/tags', {
      templateUrl: 'partials/tags.tpl.html',
      controller: 'TagsCtrl'
    });
  }])
  .controller('TagsCtrl', ['$scope', '$http', '$location', 'alertService',
    function($scope, $http, $location, alertService) {
      $scope.tags = [];
      $scope.order = 'name';
      $scope.reverse = false;
      $scope.loading = true;
      $scope.error = null;

      // Load tags
      $http.get('/api/tags')
        .then(function(response) {
          $scope.tags = response.data;
          $scope.loading = false;
        })
        .catch(function(error) {
          $scope.error = error.data?.error || 'Failed to load tags';
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

      $scope.addTag = function() {
        if (!$scope.newTag?.name) {
          alertService.error('Name is required');
          return;
        }

        $http.post('/api/tags', $scope.newTag)
          .then(function(response) {
            $scope.tags.push(response.data);
            $scope.newTag = {};
            alertService.success('Tag added successfully');
          })
          .catch(function(error) {
            alertService.error(error.data?.error || 'Failed to add tag');
          });
      };

      $scope.editTag = function(tag) {
        $scope.selectedTag = angular.copy(tag);
      };

      $scope.saveTag = function(tag) {
        if (!tag.name) {
          alertService.error('Name is required');
          return;
        }

        $http.put('/api/tags/' + tag._id, tag)
          .then(function() {
            const index = $scope.tags.findIndex(item => item._id === tag._id);
            if (index !== -1) {
              $scope.tags[index] = tag;
            }
            $scope.selectedTag = null;
            alertService.success('Tag updated successfully');
          })
          .catch(function(error) {
            alertService.error(error.data?.error || 'Failed to update tag');
          });
      };

      $scope.deleteTag = function(tag) {
        if (!confirm('Are you sure you want to delete this tag?')) {
          return;
        }

        $http.delete('/api/tags/' + tag._id)
          .then(function() {
            $scope.tags = $scope.tags.filter(item => item._id !== tag._id);
            alertService.success('Tag deleted successfully');
          })
          .catch(function(error) {
            alertService.error(error.data?.error || 'Failed to delete tag');
          });
      };
    }
  ]);
