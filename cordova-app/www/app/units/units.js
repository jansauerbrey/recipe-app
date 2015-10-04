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

    }])

    .controller('UnitDetailCtrl', ['$scope', '$stateParams', 'Units', '$state', function ($scope, $stateParams, Units, $state) {
      if (!$stateParams.id) {}
      else $scope.unit = Units.get({id: $stateParams.id });

      $scope.update = function(){
        Units.update({id: $scope.unit._id}, $scope.unit, function(){
          $state.go('admin.units.list');
        });
      }

      $scope.remove = function(){
        Units.remove({id: $scope.unit._id}, function(){
          $state.go('admin.units.list');
        });
      }

      $scope.save = function(){
        if(!$scope.newunit || $scope.newunit.length < 1) return;
        var unit = new Units({ name: { en: $scope.newunit.name.en, de: $scope.newunit.name.de,  fi: $scope.newunit.name.fi} });

        unit.$save(function(){
          $state.go('admin.units.list');
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


