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

    .controller('UnitsController', ['$scope', 'units', function ($scope, units) {
      $scope.units = units;
    }])

    .controller('UnitDetailCtrl', ['$scope', '$stateParams', 'unit', 'Units', '$state', function ($scope, $stateParams, unit, Units, $state) {
      $scope.unit = unit;

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
        var unit_new = new Units({ name: { en: $scope.newunit.name.en, de: $scope.newunit.name.de,  fi: $scope.newunit.name.fi} });

        unit_new.$save(function(){
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
      data: {
        title: 'Units'
      }
    })
    .state('admin.units.list', {
      url: '/list',
        		templateUrl: 'partials/units.tpl.html',
        		controller: 'UnitsController',
      resolve: {
        units: ['Units', function(Units){
          return Units.query().$promise;
        }]
      },
      data: {
        			name: 'Units',
        			icon: 'glyphicon glyphicon-scale'
      }
      		})
      		.state('admin.units.edit', {
      url: '/edit/:id',
        		templateUrl: 'partials/units.details.tpl.html',
        		controller: 'UnitDetailCtrl',
      resolve: {
        unit: ['Units', '$stateParams', function(Units, $stateParams){
          var unit = Units.get({'id': $stateParams.id}, function(response) {
            return response;
          }).$promise;
          return unit;
        }]
      }
     		})
      		.state('admin.units.add', {
      url: '/add',
        		templateUrl: 'partials/units.add.tpl.html',
        		controller: 'UnitDetailCtrl',
      resolve: {
        unit: ['Units', function(Units){
          var unit = new Units();
          return unit;
        }]
      }
      		})
    ;
  }])
;


