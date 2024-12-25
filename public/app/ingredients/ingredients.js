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

  .controller('IngredientsController', ['$scope', 'ingredients', function ($scope, ingredients) {
    $scope.ingredients = ingredients;
  }])

  .controller('IngredientDetailCtrl', ['$scope', '$stateParams', 'ingredient', 'Ingredients', 'categories', '$state', function ($scope, $stateParams, ingredient, Ingredients, categories, $state) {
    $scope.categories = categories;
    $scope.selectedcategory = {};

    $scope.ingredient = ingredient;
    $scope.selectedcategory.category = ingredient.category;
    $scope.selectedcategory.subcategory = ingredient.subcategory;
    $scope.selectedcategory.subsubcategory = ingredient.subsubcategory;
    $scope.selectedcategory.rewe_cat_id = ingredient.rewe_cat_id;

    $scope.update = function(){
      $scope.ingredient.category = $scope.selectedcategory.category;
      $scope.ingredient.subcategory = $scope.selectedcategory.subcategory;
      $scope.ingredient.subsubcategory = $scope.selectedcategory.subsubcategory;
      $scope.ingredient.rewe_cat_id = $scope.selectedcategory.rewe_cat_id;
      Ingredients.update({id: $scope.ingredient._id}, $scope.ingredient, function(){
        $state.go('admin.ingredients.list');
      });
    };

    $scope.remove = function(){
      Ingredients.remove({id: $scope.ingredient._id}, function(){
        $state.go('admin.ingredients.list');
      });
    };

    $scope.save = function(){
      if(!$scope.newingredient || $scope.newingredient.length < 1) return;
      $scope.newingredient.category = $scope.selectedcategory.category;
      $scope.newingredient.subcategory = $scope.selectedcategory.subcategory;
      $scope.newingredient.subsubcategory = $scope.selectedcategory.subsubcategory;
      $scope.newingredient.rewe_cat_id = $scope.selectedcategory.rewe_cat_id;
      const ingredient_new = new Ingredients( $scope.newingredient );

      ingredient_new.$save(function(){
        $state.go('admin.ingredients.list');
      });
    };

  }])


//---------------
// Routes
//---------------

  .config(['$stateProvider', '$urlRouterProvider', function ($stateProvider, $urlRouterProvider) {

    $stateProvider	
      .state('admin.ingredients', {
        abstract: true,
        url: '/ingredients',
        template: '<ui-view />',
        data: {
          title: 'Ingredients'
        }
      })
      .state('admin.ingredients.list', {
        url: '/list',
        templateUrl: 'partials/ingredients.tpl.html',
        controller: 'IngredientsController',
        resolve: {
          ingredients:['Ingredients', function(Ingredients){
            return Ingredients.query().$promise;
          }]
        },
        data: {
          name: 'Ingredients',
          icon: 'glyphicon glyphicon-apple'
        }
      })
      .state('admin.ingredients.edit', {
        url: '/edit/:id',
        templateUrl: 'partials/ingredients.details.tpl.html',
        controller: 'IngredientDetailCtrl',
        resolve: {
          ingredient: ['Ingredients', '$stateParams', function(Ingredients, $stateParams){
            const ingredient = Ingredients.get({'id': $stateParams.id}, function(response) {
              return response;
            }).$promise;
            return ingredient;
          }],
          categories: ['Categories', function(Categories){
            return Categories.query().$promise;
          }]
        }
      })
      .state('admin.ingredients.add', {
        url: '/add',
        templateUrl: 'partials/ingredients.add.tpl.html',
        controller: 'IngredientDetailCtrl',
        resolve: {
          ingredient: ['Ingredients', function(Ingredients){
            const ingredient = new Ingredients();
            return ingredient;
          }],
          categories: ['Categories', function(Categories){
            return Categories.query().$promise;
          }]
        }
      })
    ;
  }])
;
