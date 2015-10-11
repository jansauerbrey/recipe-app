angular.module('app.frequentshopitems', ['ui.router'])

//---------------
// Services
//---------------

        .factory('Frequentshopitems', ['$resource', 'BASE_URI', function($resource, BASE_URI){
          return $resource(BASE_URI+'api/frequentshopitems/');
        }])

//---------------
// Controllers
//---------------


// Frequentshopitems

    .controller('FrequentshopitemsController', ['$scope', '$stateParams', '$modal', 'Frequentshopitems', 'Shopitems', 'Units', '$state', '$filter', function ($scope, $stateParams, $modal, Frequentshopitems, Shopitems, Units, $state, $filter) {

      $scope.alerts = [];
      $scope.loading = true;

      Frequentshopitems.query(function(response) {
        $scope.loading = false;
	$scope.frequentshopitems = response;
      });

      $scope.units = Units.query();

      $scope.addShopitem = function(newshopitem){
        var expDate = new Date();
        expDate.setDate(expDate.getDate() + 14);
        expDate.setHours(0, 0, 0, 0);
        var newshopitem = new Shopitems({ingredient: newshopitem.ingredient, unit: newshopitem.unit, amount: newshopitem.amount, completed: false , expire_date: expDate });
        newshopitem.$save();
      }

      $scope.modalFrequentshopitemAdd = function(ingredient) {
        var modalAddFrequentshopitem = $modal.open({
          animation: true,
          templateUrl: 'partials/frequentshopitems.modal.add.tpl.html',
          controller: 'ModalFrequentshopitemAddController',
          size: 'lg',
          resolve: {
            ingredient: function(){
              return ingredient;
            },
            units: function(){
              return $scope.units;
            }
          }
        });

        modalAddFrequentshopitem.result.then(function(response){
          $scope.addShopitem(response);
        });

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
          var message = 'The ingredient '+response.ingredient.name.de+' was successfully added '+response.amount+' times to the shopping list.';
          $scope.alerts.push({type: 'success', msg: message});
        });

      }

    }])


    .controller('ModalFrequentshopitemAddController', ['$scope', '$stateParams', '$modalInstance', 'ingredient', 'units', function ($scope, $stateParams, $modalInstance, ingredient, units) {
     
      $scope.units = units;
      $scope.newunit = $scope.units[2]._id;

      $scope.ingredient = ingredient;

      $scope.ok = function(){
	for(i=0;i<$scope.units.length;i++){
	    if($scope.units[i]._id === $scope.newunit) {
	      $scope.newunitobject = $scope.units[i];
	    }
	  }
        $modalInstance.close({amount: $scope.amount, unit: $scope.newunitobject, ingredient: $scope.ingredient});
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
      		.state('user.frequentshopitems', {
			url: '/shopitems/frequent',
        		templateUrl: 'partials/frequentshopitems.tpl.html',
        		controller: 'FrequentshopitemsController',
			data: {
	        		name: 'Add to List',
        			icon: 'glyphicon glyphicon-list-alt'
			}
      		})
    ;
  }])
;


