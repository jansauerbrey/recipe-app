angular.module('app.shopitems', ['ui.router', 'modalstate'])

//---------------
// Services
//---------------

  .factory('Shopitems', ['$resource', 'BASE_URI', function($resource, BASE_URI) {
    return $resource(BASE_URI + 'api/units/:id', null, {
      'update': {
        method: 'PUT'
      }
    });
  }])

  .factory('Frequentshopitems', ['$resource', 'BASE_URI', function($resource, BASE_URI) {
    return $resource(BASE_URI + 'api/frequentshopitems/');
  }])

  .factory('ShopitemService', ['$rootScope', '$timeout', '$q', 'UserService', 'Shopitems', function($rootScope, $timeout, $q, UserService, Shopitems) {
    const data = {
      shopitems: [],
      alerts: [],
      autoupdate: true,
      pauseAutoupdate: 0
    };
    const containsObj = function(array, obj) {
      let i;
      for (i = 0; i < array.length; i++) {
        if (angular.equals(array[i], obj)) return i;
      }
      return false;
    };
    const retrieveShopitems = function() {
      const deferred = $q.defer();
      Shopitems.query(function(response) {
        const uniqueIngredients = [];
        const uniqueIngredientsTemp = [];
        const user = UserService.getCurrentLoginUser();
        for (let i = 0; i < response.length; i++) {
          let categoryOrder = 99999;
          if (response[i].ingredient) {
            categoryOrder = user.settings.categoryOrder.indexOf(response[i].ingredient.category) >= 0 ?
              user.settings.categoryOrder.indexOf(response[i].ingredient.category) : 99999;
          }
          if (response[i].ingredient && response[i].unit && response[i].amount) {
            response[i].ingredient.name_translated = response[i].ingredient.name[user.settings.preferredLanguage];
            response[i].unit.name_translated = response[i].unit.name[user.settings.preferredLanguage];
            const obj = {
              ingredient: response[i].ingredient,
              unit: response[i].unit,
              order: categoryOrder,
              completed: response[i].completed,
              details: [],
              amount: 0
            };
            const index = containsObj(uniqueIngredientsTemp, obj);
            if (index === false) {
              uniqueIngredientsTemp.push({
                ingredient: response[i].ingredient,
                unit: response[i].unit,
                order: categoryOrder,
                completed: response[i].completed,
                details: [],
                amount: 0
              });
              obj.details.push(response[i]);
              obj.amount = response[i].amount;
              uniqueIngredients.push(obj);
            } else {
              uniqueIngredients[index].details.push(response[i]);
              uniqueIngredients[index].amount = response[i].amount + uniqueIngredients[index].amount;
            }
          }
        }
        deferred.resolve(uniqueIngredients);
        data.shopitems = uniqueIngredients;
        $rootScope.$broadcast('shopitemsUpdated');
      });
      return deferred.promise;
    };


    const addShopitem = function(newshopitem) {
      const expDate = new Date();
      expDate.setDate(expDate.getDate() + 14);
      expDate.setHours(0, 0, 0, 0);
      const newshopitemClean = new Shopitems({
        ingredient: newshopitem.ingredient,
        unit: newshopitem.unit,
        amount: newshopitem.amount,
        completed: false,
        expire_date: expDate
      });
      newshopitemClean.$save();
      data.shopitems.push({
        ingredient: newshopitem.ingredient,
        unit: newshopitem.unit,
        completed: newshopitem.completed,
        details: [newshopitem],
        amount: newshopitem.amount
      });
    };

    const remove = function(item) {
      data.pauseAutoupdate = data.pauseAutoupdate + 1;
      if (!item) {
        Shopitems.remove({}, null, function(success) {
          data.shopitems = [];
          $rootScope.$broadcast('shopitemsUpdated');
        }, function(err) {
          data.alerts.push({
            type: 'danger',
            msg: 'Network connection error'
          });
        });
      } else {
        const itemIndex = containsObj(data.shopitems, item);
        if (itemIndex === false) {
          data.alerts.push({
            type: 'danger',
            msg: 'Match not found in existing shopping list, please inform the developer.'
          });
        } else {
          for (let i = item.details.length - 1; i >= 0; i--) {
            Shopitems.remove({
              id: item.details[i]._id
            }, null, function(success) {
              let index;
              for (let j = 0; j < data.shopitems[itemIndex].details.length; j++) {
                if (data.shopitems[itemIndex].details[j]._id == success._id) {
                  index = j;
                }
              }
              data.shopitems[itemIndex].details.splice(index, 1);
              if (data.shopitems[itemIndex].details.length === 0) {
                data.shopitems.splice(itemIndex, 1);
              }
            }, function(err) {
              data.alerts.push({
                type: 'danger',
                msg: 'Network connection error'
              });
            });
          }
        }
      }
      $timeout(function() {
        data.pauseAutoupdate = data.pauseAutoupdate - 1;
      }, 5000);
    };

    const complete = function(item) {
      data.pauseAutoupdate = data.pauseAutoupdate + 1;

      const itemIndex = containsObj(data.shopitems, item);
      if (itemIndex === false) {
        data.alerts.push({
          type: 'danger',
          msg: 'Match not found in existing shopping list, please inform the developer.'
        });
      } else {
        item.completed = !item.completed;
        for (let i = item.details.length - 1; i >= 0; i--) {
          Shopitems.update({
            id: item.details[i]._id
          }, {
            completed: item.completed
          }, function(success) {
            let index;
            for (let j = 0; j < data.shopitems[itemIndex].details.length; j++) {
              if (data.shopitems[itemIndex].details[j]._id == success._id) {
                index = j;
              }
            }
            data.shopitems[itemIndex].details[index].completed = item.completed;
          }, function(err) {
            data.alerts.push({
              type: 'danger',
              msg: 'Network connection error'
            });
          });
        }

        data.shopitems[itemIndex].completed = item.completed;
      }
      $timeout(function() {
        data.pauseAutoupdate = data.pauseAutoupdate - 1;
      }, 5000);
    };




    // autoupdate
    let timer;
    const syncFunction = function() {
      if (data.autoupdate === true && data.pauseAutoupdate <= 0) {
        retrieveShopitems();
        this.timer = $timeout(function() {
          syncFunction();
        }, 5000);
      } else if (data.autoupdate === false) {
        $timeout.cancel(timer);
      } else {
        this.timer = $timeout(function() {
          syncFunction();
        }, 5000);
      }
    };

    const startAutoupdate = function() {
      if (data.autoupdate === false || !this.timer) {
        data.autoupdate = true;
        $rootScope.$broadcast('autoupdateValueChanged');
        syncFunction();
      }
    };

    const stopAutoupdate = function() {
      data.autoupdate = false;
      $rootScope.$broadcast('autoupdateValueChanged');
      $timeout.cancel(timer);
    };


    return {
      data: data,
      retrieveShopitems: retrieveShopitems,
      addShopitem: addShopitem,
      remove: remove,
      complete: complete,
      startAutoupdate: startAutoupdate,
      stopAutoupdate: stopAutoupdate
    };
  }])


//---------------
// Controllers
//---------------


// Shopitems

  .controller('ShopitemsController', ['$scope', '$uibModal', 'ShopitemService', 'Shopitems', 'frequentshopitems', 'TAIngredients', 'units', 'shopitems', function($scope, $uibModal, ShopitemService, Shopitems, frequentshopitems, TAIngredients, units, shopitems) {

    $scope.units = units;
    $scope.frequentshopitems = frequentshopitems;
    $scope.shopitems = ShopitemService.data.shopitems;
    $scope.autoupdate = ShopitemService.data.autoupdate;
    $scope.alerts = ShopitemService.data.alerts;


    $scope.$on('shopitemsUpdated', function() {
      $scope.shopitems = ShopitemService.data.shopitems;
    });
    $scope.$on('autoupdateValueChanged', function() {
      $scope.autoupdate = ShopitemService.data.autoupdate;
    });


    $scope.status = [];
    for (i = 0; i < $scope.shopitems.length; i++) {
      $scope.status[$scope.shopitems[i].ingredient.category] = true;
    }

    $scope.addShopitem = function(item) {
      ShopitemService.addShopitem(item);
    };

    $scope.remove = function(item) {
      ShopitemService.remove(item);
    };

    $scope.complete = function(item) {
      ShopitemService.complete(item);
    };

    $scope.startAutoupdate = function() {
      ShopitemService.startAutoupdate();
    };

    $scope.stopAutoupdate = function() {
      ShopitemService.stopAutoupdate();
    };

    if ($scope.autoupdate === true) {
      $scope.startAutoupdate();
    }
    $scope.$on('$destroy',
      function(event) {
        $scope.stopAutoupdate();
      }
    );


    $scope.GetIngredients = function(viewValue) {
      return TAIngredients.search({
        search: viewValue,
        language: 'de'
      })
        .$promise.then(function(response) {
          return response;
        });
    };

    $scope.shopitemDetails = function(item) {
      const modalShopitemDetails = $uibModal.open({
        animation: true,
        templateUrl: 'partials/shopitems.modal.details.tpl.html',
        controller: 'ModalShopitemDetailsController',
        size: 'lg',
        resolve: {
          item: function() {
            return item;
          },
          units: function() {
            return $scope.units;
          }
        }
      });

      modalShopitemDetails.result.then(function() {
        ShopitemService.retrieveShopitems();
      });
    };

    $scope.closeAlert = function(index) {
      $scope.alerts.splice(index, 1);
    };

  }])




  .controller('ShopitemsActionController', ['$scope', '$uibModal', 'ShopitemService', 'units', function($scope, $uibModal, ShopitemService, units) {

    $scope.units = units;
    $scope.autoupdate = ShopitemService.data.autoupdate;
    $scope.alerts = ShopitemService.data.alerts;

    $scope.$on('autoupdateValueChanged', function() {
      $scope.autoupdate = ShopitemService.data.autoupdate;
    });



    $scope.addShopitem = function(item) {
      ShopitemService.addShopitem(item);
    };

    $scope.remove = function(item) {
      ShopitemService.remove(item);
    };

    $scope.startAutoupdate = function() {
      ShopitemService.startAutoupdate();
    };

    $scope.stopAutoupdate = function() {
      ShopitemService.stopAutoupdate();
    };


  }])



  .controller('ShopitemsActionSidebarController', ['$scope', '$uibModal', 'ShopitemService', 'units', '$uibModalInstance', 'isCordova', function($scope, $uibModal, ShopitemService, units, $uibModalInstance, isCordova) {
    $scope.isCordova = isCordova;

    $scope.units = units;
    $scope.autoupdate = ShopitemService.data.autoupdate;
    $scope.alerts = ShopitemService.data.alerts;

    $scope.$on('autoupdateValueChanged', function() {
      $scope.autoupdate = ShopitemService.data.autoupdate;
    });

    $scope.printingAvailable = cordova.plugins.printer.isAvailable(function(isAvailable) {
      return isAvailable;
    });


    $scope.printInApp = function() {
      const page = document.getElementById('section-to-print');

      cordova.plugins.printer.print(page, 'Shopitems.html', function() {
        alert('printing finished or canceled');
      });
    };

    $scope.addShopitem = function(item) {
      ShopitemService.addShopitem(item);
    };

    $scope.remove = function(item) {
      ShopitemService.remove(item);
    };

    $scope.startAutoupdate = function() {
      ShopitemService.startAutoupdate();
    };

    $scope.stopAutoupdate = function() {
      ShopitemService.stopAutoupdate();
    };

    $scope.closeSidebar = function() {
      $uibModalInstance.dismiss('cancel');
    };

  }])




  .controller('ModalShopitemDetailsController', ['$scope', '$stateParams', '$uibModalInstance', 'item', 'Shopitems', function($scope, $stateParams, $uibModalInstance, item, Shopitems) {
    $scope.item = item;


    $scope.complete = function(item) {
      item.completed = !item.completed;
      Shopitems.update({
        id: item._id
      }, {
        completed: item.completed
      }, function(success) {
        for (let i = 0; i < $scope.item.details.length; i++) {
          if ($scope.item.details[i]._id == success._id) {
            $scope.item.details[i].completed = item.completed;
          }
        }
      }, function(err) {});
    };

    $scope.remove = function(item) {
      item.completed = !item.completed;
      Shopitems.remove({
        id: item._id
      }, null, function(success) {
        for (let i = 0; i < $scope.item.details.length; i++) {
          if ($scope.item.details[i]._id == success._id) {
            $scope.item.details.splice(i, 1);
          }
        }
      }, function(err) {});
    };


    $scope.close = function() {
      $uibModalInstance.close();
    };
  }])

  .controller('ModalShopitemAddController', ['$scope', '$stateParams', '$uibModalInstance', 'TAIngredients', 'units', 'ShopitemService', function($scope, $stateParams, $uibModalInstance, TAIngredients, units, ShopitemService) {

    $scope.submitted = false;
    $scope.units = units;
    $scope.newunit = $stateParams.unit ? $stateParams.unit._id : undefined;
    $scope.newingredient = $stateParams.ingredient ? $stateParams.ingredient : undefined;

    $scope.GetIngredients = function(viewValue) {
      return TAIngredients.search({
        search: viewValue,
        language: 'de'
      })
        .$promise.then(function(response) {
          return response;
        });
    };

    $scope.ok = function(validForm) {
      if (!validForm) {
        $scope.submitted = true;
        return;
      }
      for (i = 0; i < $scope.units.length; i++) {
        if ($scope.units[i]._id === $scope.newunit) {
          $scope.newunitobject = $scope.units[i];
        }
      }

      const item = {
        amount: $scope.newamount,
        unit: $scope.newunitobject,
        ingredient: $scope.newingredient
      };
      ShopitemService.addShopitem(item);
      $uibModalInstance.close();
    };

    $scope.cancel = function() {
      $uibModalInstance.dismiss('cancel');
    };


  }])


  .controller('ActionSidebarShopitemsController', ['$scope', '$aside', 'units', function($scope, $aside, units) {
    $scope.shopitemsActions = function() {
      $aside.open({
        template: '<div ng-click="closeSidebar()" ng-include="\'partials/shopitems.links.tpl.html\'"></div>',
        controller: 'ShopitemsActionSidebarController',
        placement: 'right',
        size: 'sm',
        resolve: {
          units: function() {
            return units;
          }
        }
      });
    };
  }])

//---------------
// Routes
//---------------


  .config(['$stateProvider', 'modalStateProvider', function($stateProvider, modalStateProvider) {
    $stateProvider
      .state('user.shopitems', {
        abstract: true,
        url: '/shopitems',
        views: {
          'main': {
            templateUrl: 'partials/shopitems.layout.tpl.html'
          }
        },
        resolve: {
          shopitems: ['ShopitemService', function(ShopitemService) {
            ShopitemService.data.autoupdate = true; //TODO: set with user settings instead
            return ShopitemService.retrieveShopitems().then(function(data) {
              return data;
            });
          }],
          frequentshopitems: ['Frequentshopitems', function(Frequentshopitems) {
            return Frequentshopitems.query().$promise;
          }],
          units: ['Units', function(Units) {
            return Units.query().$promise;
          }]
        },
        data: {
          title: 'Shopping'
        }
      })
      .state('user.shopitems.view', {
        url: '',
        views: {
          'main': {
            templateUrl: 'partials/shopitems.tpl.html',
            controller: 'ShopitemsController'
          },
          'sidelinks': {
            templateUrl: 'partials/shopitems.links.tpl.html',
            controller: 'ShopitemsActionController'
          },
          'actionnavigation-xs@': {
            template: '<button type="button" class="navbar-toggle visible-xs actionbutton" ng-click="shopitemsActions()"><i class="glyphicon glyphicon-option-horizontal"></i></button>',
            controller: 'ActionSidebarShopitemsController'
          },
          'actionnavigation-sm@': {
            template: '<a ng-click="shopitemsActions()" class="navbar-sm-more"><span class="glyphicon glyphicon-plus padding-right-10"></span>More</a>',
            controller: 'ActionSidebarShopitemsController'
          }
        }
      });


    modalStateProvider
      .state('user.shopitems.view.add', {
        url: '/add',
        templateUrl: 'partials/shopitems.modal.add.tpl.html',
        controller: 'ModalShopitemAddController',
        params: {
          ingredient: undefined,
          unit: undefined
        },
        resolve: {
          units: ['Units', function(Units) {
            return Units.query().$promise;
          }]
        }
      });
  }]);