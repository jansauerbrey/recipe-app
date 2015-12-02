angular.module('app.schedules', ['ui.router'])

//---------------
// Services
//---------------

        .factory('Schedules', ['$resource', 'BASE_URI', function($resource, BASE_URI){
          return $resource(BASE_URI+'api/schedules/:id', null, {
            'update': { method:'PUT' }
          });
        }])


//---------------
// Controllers
//---------------

// Schedules

    .controller('SchedulesController', ['$scope', '$stateParams', '$uibModal', 'Schedules', 'TARecipes', function ($scope, $stateParams, $uibModal, Schedules, TARecipes) {

			$scope.alerts = [];
	
      if (!$stateParams.date) {
        $scope.startDate = new Date();
        $scope.endDate = new Date();
        $scope.endDate.setDate($scope.startDate.getDate() + 6);
      }
      else {
        $scope.startDate = new Date($stateParams.date);
        $scope.endDate = new Date($stateParams.date);
        $scope.prevDate = new Date($stateParams.date);
        $scope.nextDate = new Date($stateParams.date);
        $scope.prevDate.setDate($scope.prevDate.getDate() - 1);
        $scope.nextDate.setDate($scope.nextDate.getDate() + 1);
      }
	  // remove hours
      $scope.startDate.setHours(0, 0, 0, 0);
      $scope.endDate.setHours(0, 0, 0, 0);
      $scope.loading = true;
      

      $scope.updateSchedules = function(startDate, endDate, populate){
        schedulesArray = [];
        while(startDate <= endDate) {
          var nextStartDate = new Date(startDate);
          nextStartDate.setDate(nextStartDate.getDate() + 1);
          schedulesArray.push({date: startDate, schedule: Schedules.query({startDate: startDate, endDate: nextStartDate})});
          startDate = nextStartDate;
        }
        $scope.schedulesArray = schedulesArray;
      }
      $scope.updateSchedules($scope.startDate, $scope.endDate, $scope.populate);

      $scope.GetRecipes = function($viewValue){
        return TARecipes.search({search: $viewValue})
          .$promise.then(function(response) {
            return response;
          });
      }

      $scope.addRecipe = function(){
        if(!$scope.newrecipe || $scope.newrecipe.length < 1) return;
        if(!$scope.newfactor || $scope.newfactor.length < 1){
          $scope.newfactor = $scope.newrecipe.yield;
        };
        var newSchedule = new Schedules({date: $scope.startDate.setHours(12), recipe: $scope.newrecipe, factor: $scope.newfactor});
        newSchedule.$save(function(response){
          $scope.schedulesArray[0].schedule.push(response);
          $scope.newrecipe = null;
        });	
      }

      $scope.remove = function(lineItem){
        Schedules.remove({id: lineItem._id}, function(){
        	var index = $scope.schedulesArray[0].schedule.indexOf(lineItem);
          $scope.schedulesArray[0].schedule.splice(index, 1);
          var message = 'The recipe '+lineItem.recipe.name+' was successfully removed from schedule';
	        $scope.alerts.push({type: 'info', msg: message});
        });
      }

      $scope.openStartDate = function($event) {
        $event.preventDefault();
        $event.stopPropagation();

        $scope.startOpened = true;
      };

      $scope.openEndDate = function($event) {
        $event.preventDefault();
        $event.stopPropagation();

        $scope.endOpened = true;
      };
      
      
      $scope.scheduleEdit = function(lineItem) {
	      var modalEditSchedule = $uibModal.open({
	        animation: true,
	        templateUrl: 'partials/recipes.scheduleadd.tpl.html',
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
		      $scope.updateSchedules($scope.startDate, $scope.endDate, $scope.populate);
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
			data: {
	        		name: 'Schedules',
        			icon: 'glyphicon glyphicon-calendar'
			}
      		})
      		.state('user.schedules.add', {
			url: '/add/:date',
        		templateUrl: 'partials/schedules.date.tpl.html',
        		controller: 'SchedulesController',
      		})
    ;
  }])

;


