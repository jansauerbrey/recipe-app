angular.module('app.dishtypes', ['ui.router'])

//---------------
// Services
//---------------


        .factory('DishTypes', ['$resource', 'BASE_URI', function($resource, BASE_URI){
          return $resource(BASE_URI+'api/dishtypes/:id', null, {
            'update': { method:'PUT' }
          });
        }])


//---------------
// Controllers
//---------------


// Dishtypes

    .controller('DishTypesController', ['$scope', 'DishTypes', function ($scope, DishTypes) {
      $scope.editing = [];
      $scope.loading = true;
      $scope.dishtypes = DishTypes.query(function(response) {
        $scope.loading = false;
      });

    }])

    .controller('DishTypeDetailCtrl', ['$scope', '$stateParams', 'DishTypes', '$state', function ($scope, $stateParams, DishTypes, $state) {
      if (!$stateParams.id) {}
      else $scope.dishtype = DishTypes.get({id: $stateParams.id });

      $scope.update = function(){
        DishTypes.update({id: $scope.dishtype._id}, $scope.dishtype, function(){
          $state.go('admin.dishtypes.list');
        });
      }

      $scope.remove = function(){
        DishTypes.remove({id: $scope.dishtype._id}, function(){
          $state.go('admin.dishtypes.list');
        });
      }

      $scope.save = function(){
        if(!$scope.newdishtype || $scope.newdishtype.length < 1) return;
        var dishtype = new DishTypes({ name: { en: $scope.newdishtype.name.en, de: $scope.newdishtype.name.de,  fi: $scope.newdishtype.name.fi} , order: $scope.newdishtype.order, imagePath: $scope.newdishtype.imagePath});

        dishtype.$save(function(){
          $state.go('admin.dishtypes.list');
        });
      }

    }])



//---------------
// Routes
//---------------

  .config(['$stateProvider', '$urlRouterProvider', function ($stateProvider, $urlRouterProvider) {

    $stateProvider	
		.state('admin.dishtypes', {
			abstract: true,
			url: '/dishtypes',
			template: "<ui-view />",
		})
		.state('admin.dishtypes.list', {
			url: '/list',
        		templateUrl: 'partials/dishtypes.tpl.html',
        		controller: 'DishTypesController',
			data: {
        			name: 'Dish types',
        			icon: 'glyphicon glyphicon-scale'
			}
      		})
      		.state('admin.dishtypes.edit', {
			url: '/edit/:id',
        		templateUrl: 'partials/dishtypes.details.tpl.html',
        		controller: 'DishTypeDetailCtrl'
     		})
      		.state('admin.dishtypes.add', {
			url: '/add',
        		templateUrl: 'partials/dishtypes.add.tpl.html',
        		controller: 'DishTypeDetailCtrl'
      		})
    ;
  }])
;


