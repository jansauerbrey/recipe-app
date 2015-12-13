angular.module('app.schedules', ['ui.router'])

//---------------
// Services
//---------------

        .factory('Schedules', ['$resource', 'BASE_URI', function($resource, BASE_URI){
          return $resource(BASE_URI+'api/schedules/:id', null, {
            'update': { method:'PUT' }
          });
        }])
        
        
        .factory('RandomRecipe', ['$resource', 'BASE_URI', function($resource, BASE_URI){
          return $resource(BASE_URI+'api/randomitems/recipes/:number', null, {
            'update': { method:'PUT' }
          });
        }])
        
        
        
        .factory('retrieveSchedules', ['Schedules', '$q', function(Schedules, $q){
		      var retrieve = function(selectedDates){
		      	var deferred = $q.defer();
		      	startDate = Math.min.apply(null, selectedDates);
		      	endDate = Math.max.apply(null, selectedDates);
		      	var startDate = new Date(startDate);
		      	startDate.setHours(0,0,0,0);
		      	startDate = startDate.getTime();
		      	var endDate = new Date(endDate);
		      	endDate.setDate(endDate.getDate() +1);
		      	endDate.setHours(0,0,0,0);
		      	endDate = endDate.getTime();
		      	Schedules.query({startDate: startDate, endDate: endDate}, function(response){
		      		var grouped = [];
		      		for(i=0;i<selectedDates.length;i++){
		      			var actualDay = new Date(selectedDates[i]);
			          actualDay.setHours(0, 0, 0, 0);
			          grouped[i] = {date: actualDay, schedule: []};
		      		}
		      		for(i=0;i<response.length;i++){
		      			var actualDay = new Date(response[i].date);
			          actualDay.setHours(0, 0, 0, 0);
			          for (j=0;j<selectedDates.length;j++)
		  					{
		    					if (angular.equals(grouped[j].date, actualDay)	) {
		    						grouped[j].schedule.push(response[i]);
		    					}
		  					} 
		      		}
							deferred.resolve(grouped);
						});
				    return deferred.promise;
		      };
      
		      return {
            retrieve: retrieve
        	}
		    }])


//---------------
// Controllers
//---------------

// Schedules

    .controller('SchedulesController', ['$scope', '$stateParams', '$uibModal', 'Schedules', 'schedules', 'retrieveSchedules', 'RandomRecipe', function ($scope, $stateParams, $uibModal, Schedules, schedules, retrieveSchedules, RandomRecipe) {

			$scope.alerts = [];
			$scope.selectedDates = [];
			$scope.schedulesArray = schedules;
      
			$scope.activeDate = new Date();
      $scope.activeDate.setHours(0, 0, 0, 0);
      
      $scope.selectSevenDays = function(date){
      	$scope.selectedDates = [];
				for(i=0;i<7;i++){
					var tempDate = new Date(date.getTime());
					tempDate.setDate(tempDate.getDate()+i);
	      	tempDate.setHours(0, 0, 0, 0);
					$scope.selectedDates.push(tempDate.getTime());
				}
			}
			$scope.selectSevenDays($scope.activeDate);
      
			$scope.updateSchedules = function(selectedDates){
				retrieveSchedules.retrieve(selectedDates).then( function(data){
							$scope.schedulesArray = data;
						});
			}
			
			$scope.selectWeek = function(dayDelta){
				var today = new Date();
				var lastSaturday = new Date(today.getTime());
				lastSaturday.setDate(lastSaturday.getDate() - lastSaturday.getDay() + dayDelta); 
				$scope.selectSevenDays(lastSaturday);
				$scope.updateSchedules($scope.selectedDates);
			}


      $scope.remove = function(lineItem, parentIndex){
        Schedules.remove({id: lineItem._id}, function(){
        	var index = $scope.schedulesArray[parentIndex].schedule.indexOf(lineItem);
          $scope.schedulesArray[parentIndex].schedule.splice(index, 1);
          var message = 'The recipe '+lineItem.recipe.name+' was successfully removed from schedule';
	        $scope.alerts.push({type: 'info', msg: message});
        });
      }

      
      $scope.scheduleAdd = function(date) {
	      var modalAddSchedule = $uibModal.open({
	        animation: true,
	        templateUrl: 'partials/schedules.add.tpl.html',
	        controller: 'ModalScheduleAddController',
	        size: 'xs',
	        resolve: {
	            date: function(){
	              return date;
	            },
	            randomRecipes: [ 'RandomRecipe', function(RandomRecipe){
								var randomRecipes = RandomRecipe.query({'number': '3'}, function(response){
									return response;
								});
								
								return randomRecipes;
	            }]
	        }
	      });
	
	      modalAddSchedule.result.then(function(successMsg){
	        $scope.alerts.push(successMsg);
		      retrieveSchedules.retrieve($scope.selectedDates).then( function(data){
						if (data) $scope.schedulesArray = data;
					});
	      });
      }
      
      $scope.scheduleEdit = function(lineItem) {
	      var modalEditSchedule = $uibModal.open({
	        animation: true,
	        templateUrl: 'partials/schedules.edit.tpl.html',
	        controller: 'ModalScheduleEditController',
	        size: 'xs',
	        resolve: {
	            schedule: function(){
	              return lineItem;
	            }
	        }
	      });
	
	      modalEditSchedule.result.then(function(successMsg){
	        $scope.alerts.push(successMsg);
		      retrieveSchedules.retrieve($scope.selectedDates).then( function(data){
						if (data) $scope.schedulesArray = data;
					});
	      });
      }
      
      $scope.closeAlert = function(index){
	      $scope.alerts.splice(index, 1);
    	}
   	
    }])


    .controller('ModalScheduleEditController', ['$scope', '$stateParams', '$modalInstance', '$filter', 'Schedules', 'schedule', function ($scope, $stateParams, $modalInstance, $filter, Schedules, schedule) {
      $scope.recipe = schedule.recipe;
      $scope.date = schedule.date;
      $scope.factor = schedule.factor;
       
      $scope.remove = function(){
        Schedules.remove({id: schedule._id}, function(){
          var message = 'The recipe '+schedule.recipe.name+' was successfully removed from schedule';
	        $modalInstance.close({type: 'info', msg: message});
        });
      }
         
      $scope.ok = function(){
        schedule.date = $scope.date;
        schedule.factor = $scope.factor;
        Schedules.update({id: schedule._id}, schedule, function(response){
          var message = 'The recipe '+$scope.recipe.name+' was successfully scheduled for the '+$filter('date')($scope.date, 'dd.MM.yyyy')+' with '+$scope.factor+' persons.';
          $modalInstance.close({type: 'success', msg: message});
        });
      }

      $scope.cancel = function(){
        $modalInstance.dismiss('cancel');
      }

    }])


    .controller('ModalScheduleAddController', ['$scope', '$stateParams', '$modalInstance', '$filter', 'Schedules', 'date', 'randomRecipes', 'TARecipes', function ($scope, $stateParams, $modalInstance, $filter, Schedules, date, randomRecipes, TARecipes) {

      $scope.date = date;
      $scope.randomRecipes = randomRecipes;
      
      $scope.GetRecipes = function($viewValue){
        return TARecipes.search({search: $viewValue})
          .$promise.then(function(response) {
            return response;
          });
      }
      
      $scope.TASelect = function (item) {
      	$scope.factor = item.yield;
      };
      
      
      $scope.selectRecipe = function (item) {
      	if (!$scope.factor) {
      		$scope.factor = item.yield;
      	}
      	$scope.newrecipe = item;
      };
      
      
      $scope.ok = function(){
      	if(!$scope.newrecipe || $scope.newrecipe.length < 1) return;
        if(!$scope.factor || $scope.factor.length < 1){
          $scope.factor = $scope.recipe.yield;
        };
        var newSchedule = new Schedules({date: $scope.date.setHours(12), recipe: $scope.newrecipe, factor: $scope.factor});
        newSchedule.$save(function(response){
          var message = 'The recipe '+$scope.newrecipe.name+' was successfully scheduled for the '+$filter('date')($scope.date, 'dd.MM.yyyy')+' with '+$scope.factor+' persons.';
          $modalInstance.close({type: 'success', msg: message});
        });
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
		.state('user.schedules', {
			abstract: true,
			url: '/schedules',
			template: "<ui-view />",
		})
      		.state('user.schedules.list', {
			url: '/list',
      templateUrl: 'partials/schedules.tpl.html',
      controller: 'SchedulesController',
			resolve: {
				schedules: function(retrieveSchedules){
						var selectedDates = [];
						for(i=0;i<7;i++){
							var tempDate = new Date();
							tempDate.setDate(tempDate.getDate()+i);
      				tempDate.setHours(0, 0, 0, 0);
							selectedDates.push(tempDate.getTime());
						}
						return retrieveSchedules.retrieve(selectedDates).then( function(data){
							return data;
						});
				}
			},
			data: {
	        		name: 'Schedules',
        			icon: 'glyphicon glyphicon-calendar'
			}
      		})
    ;
  }])

;


