angular.module('app.units', ['ui.router'])

//---------------
// Services
//---------------


        .factory('Units', ['$resource', 'BASE_URI', function($resource, BASE_URI){
          return $resource(BASE_URI+'api/units/:id', null, {
            'update': { method:'PUT' }
          });
        }])


//---------------
// Controllers
//---------------


// Units

    .controller('UnitsController', ['$scope', 'Units', function ($scope, Units) {
      $scope.editing = [];
      $scope.loading = true;
      $scope.units = Units.query(function(response) {
        $scope.loading = false;
      });

      $scope.update = function(index){
        var unit = $scope.units[index];
        Units.update({id: unit._id}, unit);
        $scope.editing[index] = false;
      }

      $scope.edit = function(index){
        $scope.editing[index] = angular.copy($scope.units[index]);
      }

      $scope.cancel = function(index){
        $scope.units[index] = angular.copy($scope.editing[index]);
        $scope.editing[index] = false;
      }

      $scope.remove = function(index){
        var unit = $scope.units[index];
        Units.remove({id: unit._id}, function(){
          $scope.units.splice(index, 1);
        });
      }

    }])

    .controller('UnitDetailCtrl', ['$scope', '$stateParams', 'Units', '$state', function ($scope, $stateParams, Units, $state) {
      if (!$stateParams.id) {}
      else $scope.unit = Units.get({id: $stateParams.id });

      $scope.update = function(){
        Units.update({id: $scope.unit._id}, $scope.unit, function(){
          $state.go('admin.units');
        });
      }

      $scope.remove = function(){
        Units.remove({id: $scope.unit._id}, function(){
          $state.go('admin.units');
        });
      }

      $scope.save = function(){
        if(!$scope.newunit || $scope.newunit.length < 1) return;
        var unit = new Units({ name: { en: $scope.newunit.name.en, de: $scope.newunit.name.de,  fi: $scope.newunit.name.fi} });

        unit.$save(function(){
          $state.go('admin.units');
        });
      }

    }])



//---------------
// Routes
//---------------

  .config(['$stateProvider', '$urlRouterProvider', function ($stateProvider, $urlRouterProvider) {

    $stateProvider	
		.state('admin.units', {
			abstract: true,
			url: '/units',
			template: "<ui-view />",
		})
		.state('admin.units.list', {
			url: '/list',
        		templateUrl: 'partials/units.tpl.html',
        		controller: 'UnitsController',
			data: {
        			name: 'Units',
        			icon: 'glyphicon glyphicon-scale'
			}
      		})
      		.state('admin.units.edit', {
			url: '/edit/:id',
        		templateUrl: 'partials/units.details.tpl.html',
        		controller: 'UnitDetailCtrl'
     		})
      		.state('admin.units.add', {
			url: '/add',
        		templateUrl: 'partials/units.add.tpl.html',
        		controller: 'UnitDetailCtrl'
      		})
    ;
  }])
;


