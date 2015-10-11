angular.module('app.shopitems', ['ui.router'])

//---------------
// Services
//---------------

        .factory('Shopitems', ['$resource', 'BASE_URI', function($resource, BASE_URI){
          return $resource(BASE_URI+'api/shopitems/:id', null, {
            'update': { method:'PUT' }
          });
        }])

//---------------
// Controllers
//---------------


// Shopitems

    .controller('ShopitemsController', ['$scope', '$stateParams', '$modal', 'UserService', 'Shopitems', 'TAIngredients', 'Units', '$state', '$filter', function ($scope, $stateParams, $modal, UserService, Shopitems, TAIngredients, Units, $state, $filter) {

      $scope.user = UserService.getCurrentLoginUser();
      containsObj = function(array, obj) {
        var i, l = array.length;
        for (i=0;i<array.length;i++)
        {
          if (angular.equals(array[i], obj)) return i;
        }
        return false;
      };

      $scope.loading = true;

      Shopitems.query(function(response) {
        $scope.loading = false;
        
        var uniqueIngredients = [];
        var uniqueIngredientsTemp = [];
        for(i=0;i<response.length;i++){
          if ( response[i].ingredient ) {
            var order = $scope.user.settings.categoryOrder.indexOf(response[i].ingredient.category) >= 0 ? $scope.user.settings.categoryOrder.indexOf(response[i].ingredient.category) : 99999;
          } else {
            var order = 99999;
          }
          var index = containsObj(uniqueIngredientsTemp, {ingredient:response[i].ingredient, unit:response[i].unit, order: order, completed: response[i].completed});
          if ( index === false) {
            uniqueIngredientsTemp.push({ingredient:response[i].ingredient, unit:response[i].unit, order: order, completed: response[i].completed});
            var obj = {ingredient:response[i].ingredient, unit:response[i].unit, order: order, completed: response[i].completed};
            obj.details = [response[i]];
            obj.amount = response[i].amount;
            uniqueIngredients.push(obj);
          }
          else {
            uniqueIngredients[index].details.push(response[i]);
            uniqueIngredients[index].amount = response[i].amount + uniqueIngredients[index].amount;
          }
        }
        $scope.shopitems = uniqueIngredients;
      });

      $scope.units = Units.query();

      $scope.GetIngredients = function(viewValue){
        return TAIngredients.search({search: viewValue, language: 'de'})
        .$promise.then(function(response) {
          return response;
        });
      };

      $scope.addShopitem = function(newshopitem){
        var expDate = new Date();
        expDate.setDate(expDate.getDate() + 14);
        expDate.setHours(0, 0, 0, 0);
	if (!newshopitem) {
          for(i=0;i<$scope.units.length;i++){
            if($scope.units[i]._id === $scope.newunit) {
              $scope.newunitobject = $scope.units[i];
            }
          }
	  newshopitem = {ingredient: $scope.newingredient, unit: $scope.newunitobject, amount: $scope.newamount};
	}
        var newshopitem = new Shopitems({ingredient: newshopitem.ingredient, unit: newshopitem.unit, amount: newshopitem.amount, completed: false , expire_date: expDate });
        newshopitem.$save();
        obj = {ingredient: newshopitem.ingredient, unit: newshopitem.unit, completed: newshopitem.completed};
        obj.details = [newshopitem];
        obj.amount = newshopitem.amount;
        $scope.shopitems.push(obj);
        $scope.newingredient = "";
        $scope.newunit = "";
        $scope.newamount = "";
      }

      $scope.removeItem = function(item){
        $scope.items.splice($scope.items.indexOf(item),1);
      }


      $scope.remove = function(item){
        for(i=0;i<item.details.length;i++){
          Shopitems.remove({id: item.details[i]._id});
        }
        $scope.shopitems.splice($scope.shopitems.indexOf(item), 1);
      }

      $scope.complete = function(item){
        for(i=0;i<item.details.length;i++){
          $scope.shopitems[$scope.shopitems.indexOf(item)].details[i].completed = item.completed;
          Shopitems.update({id: item.details[i]._id}, item.details[i]);
        }
      }


      $scope.modalShopitemAdd = function() {
        var modalAddShopitem = $modal.open({
          animation: true,
          templateUrl: 'partials/shopitems.modal.add.tpl.html',
          controller: 'ModalShopitemAddController',
          size: 'lg',
          resolve: {
            units: function(){
              return $scope.units;
            }
          }
        });

        modalAddShopitem.result.then(function(response){
          $scope.addShopitem(response);
        });

      }

    }])


    .controller('ModalShopitemAddController', ['$scope', '$stateParams', '$modalInstance', 'TAIngredients', 'units', function ($scope, $stateParams, $modalInstance, TAIngredients, units) {
     
      $scope.units = units;

      $scope.GetIngredients = function(viewValue){
        return TAIngredients.search({search: viewValue, language: 'de'})
        .$promise.then(function(response) {
          return response;
        });
      };

      $scope.ok = function(){
        for(i=0;i<$scope.units.length;i++){
          if($scope.units[i]._id === $scope.newunit) {
            $scope.newunitobject = $scope.units[i];
          }
        }
        $modalInstance.close({amount: $scope.newamount, unit: $scope.newunitobject, ingredient: $scope.newingredient});
      }

      $scope.cancel = function(){
        $modalInstance.dismiss('cancel');
      }


    }])

//---------------
// Routes
//---------------

  .config(['$stateProvider', '$urlRouterProvider', function ($stateProvider, $urlRouterProvider) {

    $stateProvider
      		.state('user.shopitems', {
			url: '/shopitems',
        		templateUrl: 'partials/shopitems.tpl.html',
        		controller: 'ShopitemsController',
			data: {
	        		name: 'Shopping',
        			icon: 'glyphicon glyphicon-shopping-cart'
			}
      		})
    ;
  }])
;


