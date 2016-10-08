angular.module('app.schedules', ['ui.router', 'modalstate'])

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
        
        
        
        .factory('SchedulesService', ['UserService', 'AlertService', 'Schedules', '$q', '$rootScope', function(UserService, AlertService, Schedules, $q, $rootScope){
          var data = {schedules: [],
          	selectedDates: [],
          	activeDate: false};
          
          var setActiveDate = function(date){
          	if (!date) {
          		date = new Date();
          	}
      			date.setHours(0, 0, 0, 0);	
          	data.activeDate = date;
          };
          
		      var selectPeriod = function(date, days){
		      	if (!date){
		      		if (!data.activeDate) {
		      			setActiveDate();
		      		}
		      		date = data.activeDate;
		      	}
		      	if (!days){
		      		days = 7;
		      	}
		      	var selectedDates = [];
						for(i=0;i<days;i++){
							var tempDate = new Date(date.getTime());
							tempDate.setDate(tempDate.getDate()+i);
			      	tempDate.setHours(0, 0, 0, 0);
							selectedDates.push(tempDate.getTime());
						}
						data.selectedDates = selectedDates;
						$rootScope.$broadcast("selectedDatesUpdated");
					};
					
							
					var selectWeek = function(weekDelta){ //dayDelta should be user settings
						var today = new Date();
						var deltaWeekStart = today.getDay();
						var userDelta = UserService.data.currentUser.settings.preferredWeekStartDay ? UserService.data.currentUser.settings.preferredWeekStartDay : 0;
						if (deltaWeekStart < userDelta) {
							today.setDate(today.getDate() - today.getDay() + userDelta - 7 + weekDelta*7);
						} else {
							today.setDate(today.getDate() - today.getDay() + userDelta + weekDelta*7); 
						}
						selectPeriod(today, 7);
						update();
					};

          	
		      var retrieve = function(){
		      	var deferred = $q.defer();
		      	var startDateTemp = Math.min.apply(null, data.selectedDates);
		      	var endDateTemp = Math.max.apply(null, data.selectedDates);
		      	var startDate = new Date(startDateTemp);
		      	startDate.setHours(0,0,0,0);
		      	startDate = startDate.getTime();
		      	var endDate = new Date(endDateTemp);
		      	endDate.setDate(endDate.getDate() +1);
		      	endDate.setHours(0,0,0,0);
		      	endDate = endDate.getTime();
		      	Schedules.query({startDate: startDate, endDate: endDate}, function(response){
		      		var grouped = [];
		      		for(i=0;i<data.selectedDates.length;i++){
		      			var actualDay = new Date(data.selectedDates[i]);
			          actualDay.setHours(0, 0, 0, 0);
			          grouped[i] = {date: actualDay, schedule: []};
		      		}
		      		for(i=0;i<response.length;i++){
		      			var actualDay = new Date(response[i].date);
			          actualDay.setHours(0, 0, 0, 0);
			          for (j=0;j<data.selectedDates.length;j++)
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
		      
		      var update = function(){
		      	retrieve().then(function(response){
		      		data.schedules = response;
							$rootScope.$broadcast("schedulesUpdated");
		      	});
		      };
		      
		      
		      var remove = function(lineItem, parentIndex){
		        Schedules.remove({id: lineItem._id}, function(){
		        	var index = data.schedules[parentIndex].schedule.indexOf(lineItem);
		          data.schedules[parentIndex].schedule.splice(index, 1);
							$rootScope.$broadcast("schedulesUpdated");
		          var message = 'The recipe '+lineItem.recipe.name+' was successfully removed from schedule';
			        AlertService.add('info', message);
		        });
		      };
		      
		      setActiveDate();
		      
		      
		      return {
		      	data: data,
		      	setActiveDate: setActiveDate,
		      	selectPeriod: selectPeriod,
		      	selectWeek: selectWeek,
		      	update: update,
            retrieve: retrieve,
            remove: remove
        	}
		    }])


//---------------
// Controllers
//---------------

// Schedules

    .controller('SchedulesController', ['$scope', '$stateParams', '$uibModal', 'Schedules', 'schedules', 'SchedulesService', 'RandomRecipe', function ($scope, $stateParams, $uibModal, Schedules, schedules, SchedulesService, RandomRecipe) {

			$scope.selectedDates = SchedulesService.data.selectedDates;
      $scope.$on("selectedDatesUpdated", function(){
      	$scope.selectedDates = SchedulesService.data.selectedDates;
      });
      
			$scope.schedulesArray = SchedulesService.data.schedules;
      $scope.$on("schedulesUpdated", function(){
      	$scope.schedulesArray = SchedulesService.data.schedules;
      });
      
			$scope.activeDate = SchedulesService.data.activeDate;
      SchedulesService.setActiveDate();

      $scope.datepickerOptions = {startingDay: 1, showWeeks: false};
      
      $scope.selectSevenDays = function(date){
      	SchedulesService.selectPeriod(date, 7);
      }
			$scope.selectSevenDays($scope.activeDate);
      
			$scope.updateSchedules = function(){
				SchedulesService.update();
			}
			
			$scope.selectWeek = function(weekDelta){
				SchedulesService.selectWeek(weekDelta);
			}


      $scope.remove = function(lineItem, parentIndex){
      	SchedulesService.remove(lineItem, parentIndex);
      }

      $scope.scheduleEdit = function(lineItem) {
	      $uibModal.open({
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
	
      }
   	
    }])


    .controller('ModalScheduleEditController', ['$scope', '$stateParams', '$uibModalInstance', '$filter', 'AlertService', 'SchedulesService', 'Schedules', 'schedule', function ($scope, $stateParams, $uibModalInstance, $filter, AlertService, SchedulesService, Schedules, schedule) {
      $scope.recipe = schedule.recipe;
      $scope.date = schedule.date;
      $scope.factor = schedule.factor;
       
      $scope.remove = function(){
        Schedules.remove({id: schedule._id}, function(){
          var message = 'The recipe '+schedule.recipe.name+' was successfully removed from schedule';
	        AlertService.add('info', message);
          SchedulesService.update();
          $uibModalInstance.close();
        });
      }
      
      $scope.ok = function(){
        schedule.date = $scope.date;
        schedule.factor = $scope.factor;
        Schedules.update({id: schedule._id}, schedule, function(response){
          var message = 'The recipe '+$scope.recipe.name+' was successfully scheduled for the '+$filter('date')($scope.date, 'dd.MM.yyyy')+' with '+$scope.factor+' persons.';
          AlertService.add('success', message);
          SchedulesService.update();
          $uibModalInstance.close();
        });
      }

      $scope.cancel = function(){
        $uibModalInstance.dismiss('cancel');
      }

    }])


    .controller('ModalScheduleAddController', ['$scope', '$state', '$stateParams', '$uibModalInstance', '$filter', 'AlertService', 'SchedulesService', 'Schedules', 'randomRecipes', 'TARecipes', function ($scope, $state, $stateParams, $uibModalInstance, $filter, AlertService, SchedulesService, Schedules, randomRecipes, TARecipes) {

      $scope.date = $stateParams.date ? $stateParams.date : new Date();
      $scope.newrecipe = $stateParams.recipe ? $stateParams.recipe : undefined;
      $scope.factor = ($stateParams.recipe && $stateParams.recipe.yield) ? $stateParams.recipe.yield : undefined;
      $scope.randomRecipes = randomRecipes;

      $scope.datepickerOptions = {startingDay: 1, showWeeks: true};
      
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
          AlertService.add('success', message);
          if ($state.includes('user.schedules')){
          	SchedulesService.update();
          }
          $uibModalInstance.close();
        });
      }

      $scope.cancel = function(){
        $uibModalInstance.dismiss('cancel');
      }

    }])



//---------------
// Routes
//---------------

  .config(['$stateProvider', 'modalStateProvider', '$urlRouterProvider', function ($stateProvider, modalStateProvider, $urlRouterProvider) {

    $stateProvider
      		.state('user.schedules', {
			url: '/schedules',
			views: {
				'main': {
		      templateUrl: 'partials/schedules.tpl.html',
		      controller: 'SchedulesController'
      	}
			},
			resolve: {
				schedules: ['SchedulesService', function(SchedulesService){
						SchedulesService.selectPeriod();
						return SchedulesService.update();
				}]
			},
			data: {
	      title: 'Schedules'
			}
      		})
    ;
    
    
    modalStateProvider
      .state('user.schedules.add', {
      	url: '/add',
      	templateUrl: 'partials/schedules.add.tpl.html',
		    controller: 'ModalScheduleAddController',
				params: {
					date: undefined,
					recipe: undefined
				},
		    resolve: {
          randomRecipes: [ 'RandomRecipe', function(RandomRecipe){
						var randomRecipes = RandomRecipe.query({'number': '3'}, function(response){
							return response;
						});
						
						return randomRecipes;
          }]
		    }
      })
    ;
    
  }])

;


