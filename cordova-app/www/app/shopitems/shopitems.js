angular.module('app.shopitems', ['ui.router', 'modalstate'])

//---------------
// Services
//---------------

        .factory('Shopitems', ['$resource', 'BASE_URI', function($resource, BASE_URI){
          return $resource(BASE_URI+'api/shopitems/:id', null, {
	    'update': { method:'PUT' }
	  });
        }])
        

        .factory('Frequentshopitems', ['$resource', 'BASE_URI', function($resource, BASE_URI){
          return $resource(BASE_URI+'api/frequentshopitems/');
        }])
        
        
        .factory('ShopitemService', ['$rootScope', '$timeout', '$q', 'UserService', 'Shopitems', function($rootScope, $timeout, $q, UserService, Shopitems){
      		
    			var data = {shopitems: [], alerts: [], autoupdate: true, pauseAutoupdate: 0};
    			var containsObj = function(array, obj) {
      			var i, l = array.length;
      			for (i=0;i<array.length;i++)
      			{
        			if (angular.equals(array[i], obj)) return i;
      			}
      			return false;
    			};
    			var retrieveShopitems = function(){
      			var deferred = $q.defer();
						Shopitems.query(function(response) {
						  var uniqueIngredients = [];
						  var uniqueIngredientsTemp = [];
						  var user = UserService.getCurrentLoginUser();
						  for(i=0;i<response.length;i++){
						    if ( response[i].ingredient ) {
						      var order = user.settings.categoryOrder.indexOf(response[i].ingredient.category) >= 0 ? user.settings.categoryOrder.indexOf(response[i].ingredient.category) : 99999;
						    } else {
						      var order = 99999;
						    }
						    var obj = {ingredient:response[i].ingredient, unit:response[i].unit, order: order, completed: response[i].completed, details: [], amount: 0};
						    var index = containsObj(uniqueIngredientsTemp, obj);
						    if ( index === false) {
						      uniqueIngredientsTemp.push({ingredient:response[i].ingredient, unit:response[i].unit, order: order, completed: response[i].completed, details: [], amount: 0});
						      obj.details.push(response[i]);
						      obj.amount = response[i].amount;
						      uniqueIngredients.push(obj);
						    }
						    else {
						      uniqueIngredients[index].details.push(response[i]);
						      uniqueIngredients[index].amount = response[i].amount + uniqueIngredients[index].amount;
						    }
						  }
						 	deferred.resolve(uniqueIngredients);
		        	data.shopitems = uniqueIngredients;
							$rootScope.$broadcast("shopitemsUpdated");
		        });
		        return deferred.promise;
		      };
		      
		      
		      var addShopitem = function(newshopitem){
		        var expDate = new Date();
		        expDate.setDate(expDate.getDate() + 14);
		        expDate.setHours(0, 0, 0, 0);
		        var newshopitemClean = new Shopitems({ingredient: newshopitem.ingredient, unit: newshopitem.unit, amount: newshopitem.amount, completed: false , expire_date: expDate });
		        newshopitemClean.$save();
		        data.shopitems.push({ingredient: newshopitem.ingredient, unit: newshopitem.unit, completed: newshopitem.completed, details: [newshopitem], amount: newshopitem.amount});
		      }
		
		      var remove = function(item){
		      	data.pauseAutoupdate = data.pauseAutoupdate+1;
		      	if (!item) {
		      		Shopitems.remove({}, null, function(success){
			          data.shopitems = []
								$rootScope.$broadcast("shopitemsUpdated");
				    	}, function(err){
				      	data.alerts.push({type: 'danger', msg: 'Network connection error'});
					    });
		      	} else {
			       	var itemIndex = containsObj(data.shopitems, item);
			        if (itemIndex === false) {
			        	data.alerts.push({type: 'danger', msg: 'Match not found in existing shopping list, please inform the developer.'});
			        } else {
			        	for(var i=item.details.length-1;i>=0;i--){
				          Shopitems.remove({id: item.details[i]._id}, null, function(success){
										var index;
										for(var j=0;j<data.shopitems[itemIndex].details.length;j++){
										  if (data.shopitems[itemIndex].details[j]._id == success._id){
										    index = j;
										  }
										}
					          data.shopitems[itemIndex].details.splice(index, 1);
										if (data.shopitems[itemIndex].details.length === 0) {
										  data.shopitems.splice(itemIndex, 1);
										}
						    	}, function(err){
						      	data.alerts.push({type: 'danger', msg: 'Network connection error'});
							    });
							  }
			      	}
		      	}
		      	$timeout(function () {
			        data.pauseAutoupdate = data.pauseAutoupdate-1;
			      }, 5000);
		      }
		
		      var complete = function(item){
		      	data.pauseAutoupdate = data.pauseAutoupdate+1;
		      	
		       	var itemIndex = containsObj(data.shopitems, item);
		       	if (itemIndex === false) {
			        	data.alerts.push({type: 'danger', msg: 'Match not found in existing shopping list, please inform the developer.'});
			      } else {
			      	item.completed = !item.completed;
			        for(var i=item.details.length-1;i>=0;i--){
			          Shopitems.update({id: item.details[i]._id}, {completed: item.completed}, function(success){
									var index;
									for(var j=0;j<data.shopitems[itemIndex].details.length;j++){
					  				if (data.shopitems[itemIndex].details[j]._id == success._id){
					    				index = j;
					  				}
									}
			            data.shopitems[itemIndex].details[index].completed = item.completed;
				    		}, function(err){
				      		data.alerts.push({type: 'danger', msg: 'Network connection error'});
				    		});
			        }
			        
			        data.shopitems[itemIndex].completed = item.completed;
			      }
			      $timeout(function () {
			        data.pauseAutoupdate = data.pauseAutoupdate-1;
			      }, 5000);
		      }
		      
		      
		      
		      
		      // autoupdate
		      var timer;
		      var syncFunction = function() {
		      	if (data.autoupdate === true && data.pauseAutoupdate <=0){
							retrieveShopitems();
							this.timer =  $timeout(function () {
			          syncFunction();
			        }, 5000);
						} else if (data.autoupdate === false) {
							$timeout.cancel(timer);
						} else {
							this.timer =  $timeout(function () {
			          syncFunction();
			        }, 5000);
			      }
		      }
		      
		      var startAutoupdate = function() {
		      	if (data.autoupdate === false || !this.timer) {
							data.autoupdate = true;
							$rootScope.$broadcast("autoupdateValueChanged");
			        syncFunction();
		      	}
		      };
		
		      var stopAutoupdate = function(){
						data.autoupdate = false;
						$rootScope.$broadcast("autoupdateValueChanged");
						$timeout.cancel(timer);
		      };
		
		      
		      return {
		      	data: data,
		      	retrieveShopitems: retrieveShopitems,
		      	addShopitem: addShopitem,
		      	remove: remove,
		      	complete: complete,
            startAutoupdate: startAutoupdate,
            stopAutoupdate: stopAutoupdate,
        	}
		    }])
        

//---------------
// Controllers
//---------------


// Shopitems

    .controller('ShopitemsController', ['$scope', '$uibModal', 'ShopitemService', 'Shopitems', 'frequentshopitems', 'TAIngredients', 'units', 'shopitems', function ($scope, $uibModal, ShopitemService, Shopitems, frequentshopitems, TAIngredients, units, shopitems) {

      $scope.units = units;
      $scope.frequentshopitems = frequentshopitems;
      $scope.shopitems = ShopitemService.data.shopitems;
      $scope.autoupdate = ShopitemService.data.autoupdate;
      $scope.alerts = ShopitemService.data.alerts;
      
      
      $scope.$on("shopitemsUpdated", function(){
      	$scope.shopitems = ShopitemService.data.shopitems;
      });
      $scope.$on("autoupdateValueChanged", function(){
      	$scope.autoupdate = ShopitemService.data.autoupdate;
      });
      
      
      $scope.status = [];
			for(i=0;i<$scope.shopitems.length;i++){
				$scope.status[$scope.shopitems[i].ingredient.category] = true;
			}

      $scope.addShopitem = function(item) {
      	ShopitemService.addShopitem(item);
      }
      
      $scope.remove = function(item) {
      	ShopitemService.remove(item);
      }
      
      $scope.complete = function(item) {
      	ShopitemService.complete(item);
      }

      $scope.startAutoupdate = function() {
      	ShopitemService.startAutoupdate();
      }
      
      $scope.stopAutoupdate = function() {
      	ShopitemService.stopAutoupdate();
      }

      if ($scope.autoupdate === true){
				$scope.startAutoupdate();
      }
			$scope.$on( "$destroy",
				function( event ) {
					$scope.stopAutoupdate();
				}
			);


      $scope.GetIngredients = function(viewValue){
        return TAIngredients.search({search: viewValue, language: 'de'})
        .$promise.then(function(response) {
          return response;
        });
      };

			$scope.shopitemDetails = function(item){
        var modalShopitemDetails = $uibModal.open({
          animation: true,
          templateUrl: 'partials/shopitems.modal.details.tpl.html',
          controller: 'ModalShopitemDetailsController',
          size: 'lg',
          resolve: {
            item: function(){
              return item;
            },
            units: function(){
              return $scope.units;
            }
          }
        });

        modalShopitemDetails.result.then(function(){
        	ShopitemService.retrieveShopitems();
        });
			}

      $scope.closeAlert = function(index){
        $scope.alerts.splice(index, 1);
      }

    }])




    .controller('ShopitemsActionController', ['$scope', '$uibModal', 'ShopitemService', 'units', function ($scope, $uibModal, ShopitemService, units) {

      $scope.units = units;
      $scope.autoupdate = ShopitemService.data.autoupdate;
      $scope.alerts = ShopitemService.data.alerts;
      
      $scope.$on("autoupdateValueChanged", function(){
      	$scope.autoupdate = ShopitemService.data.autoupdate;
      });
      
      

      $scope.addShopitem = function(item) {
      	ShopitemService.addShopitem(item);
      }
      
      $scope.remove = function(item) {
      	ShopitemService.remove(item);
      }

      $scope.startAutoupdate = function() {
      	ShopitemService.startAutoupdate();
      }
      
      $scope.stopAutoupdate = function() {
      	ShopitemService.stopAutoupdate();
      }


    }])



    .controller('shopitemsActionSidebarCtrl', ['$scope', '$uibModal', 'ShopitemService', 'units', '$uibModalInstance', function ($scope, $uibModal, ShopitemService, units, $uibModalInstance) {

      $scope.units = units;
      $scope.autoupdate = ShopitemService.data.autoupdate;
      $scope.alerts = ShopitemService.data.alerts;
      
      $scope.$on("autoupdateValueChanged", function(){
      	$scope.autoupdate = ShopitemService.data.autoupdate;
      });
      
      

      $scope.addShopitem = function(item) {
      	ShopitemService.addShopitem(item);
      }
      
      $scope.remove = function(item) {
      	ShopitemService.remove(item);
      }

      $scope.startAutoupdate = function() {
      	ShopitemService.startAutoupdate();
      }
      
      $scope.stopAutoupdate = function() {
      	ShopitemService.stopAutoupdate();
      }
      
      $scope.closeSidebar = function(){
        $uibModalInstance.dismiss('cancel');
      }

    }])




    .controller('ModalShopitemDetailsController', ['$scope', '$stateParams', '$uibModalInstance', 'item', 'Shopitems', function ($scope, $stateParams, $uibModalInstance, item, Shopitems) {
      $scope.item = item;
      
      
      $scope.complete = function(item){
    		item.completed = !item.completed;
				Shopitems.update({id: item._id}, {completed: item.completed}, function(success){
					for(var i=0;i<$scope.item.details.length;i++){
	  				if ($scope.item.details[i]._id == success._id){
	    				$scope.item.details[i].completed = item.completed;
	  				}
					}
    		}, function(err){
    		});
    	}
    	
      $scope.remove = function(item){
    		item.completed = !item.completed;
				Shopitems.remove({id: item._id}, null, function(success){
					for(var i=0;i<$scope.item.details.length;i++){
					  if ($scope.item.details[i]._id == success._id){
	    				$scope.item.details.splice(i, 1);
	  				}
					}
    		}, function(err){
    		});
    	}


      $scope.close = function(){
        $uibModalInstance.close();
      }
    }])

    .controller('ModalShopitemAddController', ['$scope', '$stateParams', '$uibModalInstance', 'TAIngredients', 'units', 'ShopitemService', function ($scope, $stateParams, $uibModalInstance, TAIngredients, units, ShopitemService) {
     
			$scope.submitted = false;
      $scope.units = units;
      $scope.newunit = $stateParams.unit ? $stateParams.unit._id: undefined;
      $scope.newingredient = $stateParams.ingredient ? $stateParams.ingredient : undefined;

      $scope.GetIngredients = function(viewValue){
        return TAIngredients.search({search: viewValue, language: 'de'})
        .$promise.then(function(response) {
          return response;
        });
      };

      $scope.ok = function(validForm){
	      if(!validForm){
					$scope.submitted = true;
	        return;
	      }
        for(i=0;i<$scope.units.length;i++){
          if($scope.units[i]._id === $scope.newunit) {
            $scope.newunitobject = $scope.units[i];
          }
        }
        
        var item = {amount: $scope.newamount, unit: $scope.newunitobject, ingredient: $scope.newingredient};
      	ShopitemService.addShopitem(item);
        $uibModalInstance.close();
      }

      $scope.cancel = function(){
        $uibModalInstance.dismiss('cancel');
      }


    }])


    .controller('ActionSidebarShopitemsController', ['$scope', '$aside', 'units', function ($scope, $aside, units) {
      $scope.shopitemsActions = function() {
            var asideInstance = $aside.open({
              template: '<div ng-click="closeSidebar()" ng-include="\'partials/shopitems.links.tpl.html\'"></div>',
              controller: 'ShopitemsActionSidebarCtrl',
              placement: 'right',
              size: 'sm',
		          resolve: {
		            units: function(){
		              return units;
		            }
		          }
            });
          }
    }])

//---------------
// Routes
//---------------


  .config(['$stateProvider', 'modalStateProvider', '$urlRouterProvider', function ($stateProvider, modalStateProvider, $urlRouterProvider) {

    $stateProvider
			.state('user.shopitems', {
				abstract: true,
				url: "/shopitems",
				views: {
					'main': {templateUrl: 'partials/shopitems.layout.tpl.html'}
				},
				resolve: {
					shopitems: function(ShopitemService){
						ShopitemService.data.autoupdate = true; //TODO: set with user settings instead
						return ShopitemService.retrieveShopitems().then( function(data){
								return data;
							});
					},
					frequentshopitems: function(Frequentshopitems){
						return Frequentshopitems.query().$promise;
					},
					units: function(Units){
						return Units.query().$promise;
					}
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
		    		template: '<a ng-click="shopitemsActions()" class="navbar-sm-more"><span class="glyphicon glyphicon-plus" style="padding-right: 10px;"></span>More</a>',
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
					units: function(Units){
						return Units.query().$promise;
					}
		    }
      })
    ;
  }])
;


