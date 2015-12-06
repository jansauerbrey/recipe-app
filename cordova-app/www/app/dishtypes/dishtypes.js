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

    .controller('DishTypesController', ['$scope', 'dishtypes', function ($scope, dishtypes) {
      $scope.dishtypes = dishtypes;
    }])

    .controller('DishTypeDetailCtrl', ['$scope', '$stateParams', 'dishtype', 'DishTypes', '$state', function ($scope, $stateParams, dishtype, DishTypes, $state) {
      $scope.dishtype = dishtype;

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
        var dishtype_new = new DishTypes({ name: { en: $scope.newdishtype.name.en, de: $scope.newdishtype.name.de,  fi: $scope.newdishtype.name.fi} , order: $scope.newdishtype.order, imagePath: $scope.newdishtype.imagePath});

        dishtype_new.$save(function(){
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
			resolve: {
				dishtypes: function(DishTypes){
					return DishTypes.query().$promise;
				}
			},
			data: {
        			name: 'Dish types',
        			icon: 'glyphicon glyphicon-grain'
			}
      		})
      		.state('admin.dishtypes.edit', {
			url: '/edit/:id',
        		templateUrl: 'partials/dishtypes.details.tpl.html',
        		controller: 'DishTypeDetailCtrl',
			resolve: {
				dishtype: ['DishTypes', '$stateParams', function(DishTypes, $stateParams){
					var dishtype = DishTypes.get({'id': $stateParams.id}, function(response) {
						return response;
					}).$promise;
					return dishtype;
				}]
			}
     		})
      		.state('admin.dishtypes.add', {
			url: '/add',
        		templateUrl: 'partials/dishtypes.add.tpl.html',
        		controller: 'DishTypeDetailCtrl',
			resolve: {
				dishtype: function(DishTypes){
					var dishtype = new DishTypes();
					return dishtype;
				}
			}
      		})
    ;
  }])
;


