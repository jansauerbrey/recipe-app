'use strict';

angular.module('recipeApp.shopitems', ['ngRoute'])
  .config(['$routeProvider', function($routeProvider) {
    $routeProvider.when('/shopitems', {
      templateUrl: 'partials/shopitems.layout.tpl.html',
      controller: 'ShopitemsCtrl'
    });
  }])
  .controller('ShopitemsCtrl', ['$scope', '$http', '$location', '$window', 'alertService',
    function($scope, $http, $location, $window, alertService) {
      $scope.shopitems = [];
      $scope.frequentshopitems = [];
      $scope.order = 'name';
      $scope.reverse = false;
      $scope.loading = true;
      $scope.error = null;

      // Load shopitems
      $http.get('/api/shopitems')
        .then(function(response) {
          $scope.shopitems = response.data;
          $scope.loading = false;
        })
        .catch(function(error) {
          $scope.error = error.data?.error || 'Failed to load shopitems';
          $scope.loading = false;
          alertService.error($scope.error);
        });

      // Load frequent shopitems
      $http.get('/api/frequentshopitems')
        .then(function(response) {
          $scope.frequentshopitems = response.data;
        })
        .catch(function(error) {
          alertService.error(error.data?.error || 'Failed to load frequent shopitems');
        });

      $scope.setOrder = function(order) {
        if ($scope.order === order) {
          $scope.reverse = !$scope.reverse;
        } else {
          $scope.order = order;
          $scope.reverse = false;
        }
      };

      $scope.addShopitem = function() {
        const modalInstance = $window.bootstrap.Modal.getOrCreateInstance(
          document.getElementById('addShopitemModal')
        );
        modalInstance.show();
      };

      $scope.editShopitem = function(shopitem) {
        $scope.selectedShopitem = angular.copy(shopitem);
        const modalInstance = $window.bootstrap.Modal.getOrCreateInstance(
          document.getElementById('editShopitemModal')
        );
        modalInstance.show();
      };

      $scope.saveShopitem = function(shopitem) {
        if (!shopitem.name) {
          alertService.error('Name is required');
          return;
        }

        const modalInstance = $window.bootstrap.Modal.getOrCreateInstance(
          document.getElementById('editShopitemModal')
        );

        $http.put('/api/shopitems/' + shopitem._id, shopitem)
          .then(function() {
            const index = $scope.shopitems.findIndex(item => item._id === shopitem._id);
            if (index !== -1) {
              $scope.shopitems[index] = shopitem;
            }
            modalInstance.hide();
            alertService.success('Shopitem updated successfully');
          })
          .catch(function(error) {
            alertService.error(error.data?.error || 'Failed to update shopitem');
          });
      };

      $scope.deleteShopitem = function(shopitem) {
        if (!confirm('Are you sure you want to delete this shopitem?')) {
          return;
        }

        $http.delete('/api/shopitems/' + shopitem._id)
          .then(function() {
            $scope.shopitems = $scope.shopitems.filter(item => item._id !== shopitem._id);
            alertService.success('Shopitem deleted successfully');
          })
          .catch(function(error) {
            alertService.error(error.data?.error || 'Failed to delete shopitem');
          });
      };

      $scope.addFrequentShopitem = function() {
        const modalInstance = $window.bootstrap.Modal.getOrCreateInstance(
          document.getElementById('addFrequentShopitemModal')
        );
        modalInstance.show();
      };

      $scope.editFrequentShopitem = function(shopitem) {
        $scope.selectedFrequentShopitem = angular.copy(shopitem);
        const modalInstance = $window.bootstrap.Modal.getOrCreateInstance(
          document.getElementById('editFrequentShopitemModal')
        );
        modalInstance.show();
      };

      $scope.saveFrequentShopitem = function(shopitem) {
        if (!shopitem.name) {
          alertService.error('Name is required');
          return;
        }

        const modalInstance = $window.bootstrap.Modal.getOrCreateInstance(
          document.getElementById('editFrequentShopitemModal')
        );

        $http.put('/api/frequentshopitems/' + shopitem._id, shopitem)
          .then(function() {
            const index = $scope.frequentshopitems.findIndex(item => item._id === shopitem._id);
            if (index !== -1) {
              $scope.frequentshopitems[index] = shopitem;
            }
            modalInstance.hide();
            alertService.success('Frequent shopitem updated successfully');
          })
          .catch(function(error) {
            alertService.error(error.data?.error || 'Failed to update frequent shopitem');
          });
      };

      $scope.deleteFrequentShopitem = function(shopitem) {
        if (!confirm('Are you sure you want to delete this frequent shopitem?')) {
          return;
        }

        $http.delete('/api/frequentshopitems/' + shopitem._id)
          .then(function() {
            $scope.frequentshopitems = $scope.frequentshopitems.filter(item => item._id !== shopitem._id);
            alertService.success('Frequent shopitem deleted successfully');
          })
          .catch(function(error) {
            alertService.error(error.data?.error || 'Failed to delete frequent shopitem');
          });
      };

      $scope.addToShoplist = function(shopitem) {
        const newShopitem = {
          name: shopitem.name,
          amount: shopitem.amount || 1,
          unit: shopitem.unit || '',
          category: shopitem.category || '',
          notes: shopitem.notes || ''
        };

        $http.post('/api/shopitems', newShopitem)
          .then(function(response) {
            $scope.shopitems.push(response.data);
            alertService.success('Added to shopping list');
          })
          .catch(function(error) {
            alertService.error(error.data?.error || 'Failed to add to shopping list');
          });
      };

      $scope.toggleComplete = function(shopitem) {
        const updatedShopitem = angular.copy(shopitem);
        updatedShopitem.completed = !shopitem.completed;

        $http.put('/api/shopitems/' + shopitem._id, updatedShopitem)
          .then(function() {
            shopitem.completed = updatedShopitem.completed;
          })
          .catch(function(error) {
            alertService.error(error.data?.error || 'Failed to update shopitem');
          });
      };

      $scope.clearCompleted = function() {
        if (!confirm('Are you sure you want to clear all completed items?')) {
          return;
        }

        const completedIds = $scope.shopitems
          .filter(item => item.completed)
          .map(item => item._id);

        if (completedIds.length === 0) {
          alertService.info('No completed items to clear');
          return;
        }

        $http.post('/api/shopitems/clear-completed', { ids: completedIds })
          .then(function() {
            $scope.shopitems = $scope.shopitems.filter(item => !item.completed);
            alertService.success('Cleared completed items');
          })
          .catch(function(error) {
            alertService.error(error.data?.error || 'Failed to clear completed items');
          });
      };

      $scope.clearAll = function() {
        if (!confirm('Are you sure you want to clear all items?')) {
          return;
        }

        if ($scope.shopitems.length === 0) {
          alertService.info('No items to clear');
          return;
        }

        $http.delete('/api/shopitems')
          .then(function() {
            $scope.shopitems = [];
            alertService.success('Cleared all items');
          })
          .catch(function(error) {
            alertService.error(error.data?.error || 'Failed to clear items');
          });
      };
    }
  ]);
