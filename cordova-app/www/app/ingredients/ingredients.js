angular.module('app.ingredients', ['ui.router'])

//---------------
// Services
//---------------

        .factory('Ingredients', ['$resource', 'BASE_URI', function($resource, BASE_URI){
          return $resource(BASE_URI+'api/ingredients/:id', null, {
            'update': { method:'PUT' }
          });
        }])

        .factory('TAIngredients', ['$resource', 'BASE_URI', function($resource, BASE_URI){
          return $resource(BASE_URI+'api/typeahead/ingredients/', null, {
            'search': { method:'GET', isArray: true }
          });
        }])

        .factory('Categories', ['$resource', 'BASE_URI', function($resource, BASE_URI){
          return $resource(BASE_URI+'api/categories/:id', null, {
            'update': { method:'PUT' }
          });
        }])

//---------------
// Controllers
//---------------


// Ingredients

    .controller('IngredientsController', ['$scope', 'Ingredients', function ($scope, Ingredients) {
      $scope.editing = [];
      $scope.loading = true;
      $scope.ingredients = Ingredients.query(function(response) {
        $scope.loading = false;
      });

    }])

    .controller('IngredientDetailCtrl', ['$scope', '$stateParams', 'Ingredients', 'Categories', '$state', function ($scope, $stateParams, Ingredients, Categories, $state) {
      $scope.categories = Categories.query();
      $scope.selectedcategory = {};

      if (!$stateParams.id) {}
      else $scope.ingredient = Ingredients.get({id: $stateParams.id }, function(response){
        $scope.selectedcategory.category = response.category;
        $scope.selectedcategory.subcategory = response.subcategory;
        $scope.selectedcategory.subsubcategory = response.subsubcategory;
        $scope.selectedcategory.rewe_cat_id = response.rewe_cat_id;
      });


      $scope.update = function(){
        $scope.ingredient.category = $scope.selectedcategory.category;
        $scope.ingredient.subcategory = $scope.selectedcategory.subcategory;
        $scope.ingredient.subsubcategory = $scope.selectedcategory.subsubcategory;
        $scope.ingredient.rewe_cat_id = $scope.selectedcategory.rewe_cat_id;
        Ingredients.update({id: $scope.ingredient._id}, $scope.ingredient, function(){
          $state.go('admin.ingredients.list');
        });
      }

      $scope.remove = function(){
        Ingredients.remove({id: $scope.ingredient._id}, function(){
          $state.go('admin.ingredients.list');
        });
      }

      $scope.save = function(){
        if(!$scope.newingredient || $scope.newingredient.length < 1) return;
        $scope.newingredient.category = $scope.selectedcategory.category;
        $scope.newingredient.subcategory = $scope.selectedcategory.subcategory;
        $scope.newingredient.subsubcategory = $scope.selectedcategory.subsubcategory;
        $scope.newingredient.rewe_cat_id = $scope.selectedcategory.rewe_cat_id;
        var ingredient = new Ingredients( $scope.newingredient );

        ingredient.$save(function(){
          $state.go('admin.ingredients.list');
        });
      }

    }])


//---------------
// Routes
//---------------

  .config(['$stateProvider', '$urlRouterProvider', function ($stateProvider, $urlRouterProvider) {

    $stateProvider	
		.state('admin.ingredients', {
			abstract: true,
			url: '/ingredients',
			template: "<ui-view />",
		})
      		.state('admin.ingredients.list', {
			url: '/list',
        		templateUrl: 'partials/ingredients.tpl.html',
        		controller: 'IngredientsController',
			data: {
        			name: 'Ingredients',
        			icon: 'glyphicon glyphicon-apple'
			}
      		})
      		.state('admin.ingredients.edit', {
			url: '/edit/:id',
        		templateUrl: 'partials/ingredients.details.tpl.html',
        		controller: 'IngredientDetailCtrl'
     		})
      		.state('admin.ingredients.add', {
			url: '/add',
        		templateUrl: 'partials/ingredients.add.tpl.html',
        		controller: 'IngredientDetailCtrl'
      		})
    ;
  }])
;


