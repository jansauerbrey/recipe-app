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

    .controller('FrequentshopitemsController', ['$scope', '$stateParams', '$uibModal', 'frequentshopitems', 'Shopitems', 'units', '$state', '$filter', function ($scope, $stateParams, $uibModal, frequentshopitems, Shopitems, units, $state, $filter) {

      $scope.alerts = [];

      $scope.frequentshopitems = frequentshopitems;
      $scope.units = units;

      $scope.addShopitem = function(newshopitem){
        var expDate = new Date();
        expDate.setDate(expDate.getDate() + 14);
        expDate.setHours(0, 0, 0, 0);
        var newshopitem = new Shopitems({ingredient: newshopitem.ingredient, unit: newshopitem.unit, amount: newshopitem.amount, completed: false , expire_date: expDate });
        newshopitem.$save();
        var message = 'The ingredient '+newshopitem.ingredient.name.de+' ('+newshopitem.amount+' '+newshopitem.unit.name.de+') was successfully added to the shopping list.';
        $scope.alerts.push({type: 'success', msg: message});
      }

      $scope.modalFrequentshopitemAdd = function(ingredient) {
        var modalAddFrequentshopitem = $uibModal.open({
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
        var modalAddShopitem = $uibModal.open({
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

      $scope.closeAlert = function(index){
        $scope.alerts.splice(index, 1);
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
			resolve: {
				frequentshopitems: function(Frequentshopitems){
					return Frequentshopitems.query().$promise;
				},
				units: function(Units){
					return Units.query().$promise;
				}
			},
			data: {
	        		name: 'Add to List',
        			icon: 'glyphicon glyphicon-list-alt'
			}
      		})
    ;
  }])
;


