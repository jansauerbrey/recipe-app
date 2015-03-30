angular.module('app', ['ngRoute', 'ngResource', 'ui.bootstrap', 'ui.checkbox'])

//---------------
// Services
//---------------

        .factory('routeNavigation', function($route, $location) {
          var routes = [];
          angular.forEach($route.routes, function (route, path) {
            if (route.name) {
              routes.push({
                path: path,
                name: route.name
              });
            }
          });
          return {
            routes: routes,
            activeRoute: function (route) {
              return route.path === $location.path();
            }
          };
        })

        .factory('Units', ['$resource', function($resource){
          return $resource('/api/units/:id', null, {
            'update': { method:'PUT' }
          });
        }])

        .factory('Ingredients', ['$resource', function($resource){
          return $resource('/api/ingredients/:id', null, {
            'update': { method:'PUT' }
          });
        }])

        .factory('Recipes', ['$resource', function($resource){
          return $resource('/api/recipes/:id', null, {
            'update': { method:'PUT' }
          });
        }])

//---------------
// Controllers
//---------------


    .controller('StartpageController', ['$scope', function ($scope) {
    }])

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

    .controller('UnitDetailCtrl', ['$scope', '$routeParams', 'Units', '$location', function ($scope, $routeParams, Units, $location) {
      $scope.unit = Units.get({id: $routeParams.id });

      $scope.update = function(){
        Units.update({id: $scope.unit._id}, $scope.unit, function(){
          $location.url('/units/');
        });
      }

      $scope.remove = function(){
        Units.remove({id: $scope.unit._id}, function(){
          $location.url('/units/');
        });
      }

    }])


    .controller('UnitAddCtrl', ['$scope', '$routeParams', 'Units', '$location', function ($scope, $routeParams, Units, $location) {

      $scope.save = function(){
        if(!$scope.newunit || $scope.newunit.length < 1) return;
        var unit = new Units({ name: { en: $scope.newunit.name.en, de: $scope.newunit.name.de,  fi: $scope.newunit.name.fi} });

        unit.$save(function(){
          $location.url('/units/');
        });
      }

    }])


// Ingredients

    .controller('IngredientsController', ['$scope', 'Ingredients', function ($scope, Ingredients) {
      $scope.editing = [];
      $scope.loading = true;
      $scope.ingredients = Ingredients.query(function(response) {
        $scope.loading = false;
      });

      $scope.update = function(index){
        var ingredient = $scope.ingredients[index];
        Ingredients.update({id: ingredient._id}, ingredient);
        $scope.editing[index] = false;
      }

      $scope.edit = function(index){
        $scope.editing[index] = angular.copy($scope.ingredients[index]);
      }

      $scope.cancel = function(index){
        $scope.ingredients[index] = angular.copy($scope.editing[index]);
        $scope.editing[index] = false;
      }

      $scope.remove = function(index){
        var ingredient = $scope.ingredients[index];
        Ingredients.remove({id: ingredient._id}, function(){
          $scope.ingredients.splice(index, 1);
        });
      }

    }])

    .controller('IngredientDetailCtrl', ['$scope', '$routeParams', 'Ingredients', '$location', function ($scope, $routeParams, Ingredients, $location) {
      $scope.ingredient = Ingredients.get({id: $routeParams.id });

      $scope.update = function(){
        Ingredients.update({id: $scope.ingredient._id}, $scope.ingredient, function(){
          $location.url('/ingredients/');
        });
      }

      $scope.remove = function(){
        Ingredients.remove({id: $scope.ingredient._id}, function(){
          $location.url('/ingredients/');
        });
      }

    }])


    .controller('IngredientAddCtrl', ['$scope', '$routeParams', 'Ingredients', '$location', function ($scope, $routeParams, Ingredients, $location) {

      $scope.save = function(){
        if(!$scope.newingredient || $scope.newingredient.length < 1) return;
        var ingredient = new Ingredients({ name: { en: $scope.newingredient.name.en, de: $scope.newingredient.name.de,  fi: $scope.newingredient.name.fi}, category: { en: $scope.newingredient.category.en, de: $scope.newingredient.category.de,  fi: $scope.newingredient.category.fi}, subcategory: { en: $scope.newingredient.subcategory.en, de: $scope.newingredient.subcategory.de,  fi: $scope.newingredient.subcategory.fi} });

        ingredient.$save(function(){
          $location.url('/ingredients/');
        });
      }

    }])


// Recipes

    .controller('RecipesController', ['$scope', 'Recipes', function ($scope, Recipes) {
      $scope.editing = [];
      $scope.loading = true;
      $scope.recipes = Recipes.query(function(response) {
        $scope.loading = false;
      });

      $scope.update = function(index){
        var recipe = $scope.recipes[index];
        Recipes.update({id: recipe._id}, recipe);
        $scope.editing[index] = false;
      }

      $scope.edit = function(index){
        $scope.editing[index] = angular.copy($scope.recipes[index]);
      }

      $scope.cancel = function(index){
        $scope.recipes[index] = angular.copy($scope.editing[index]);
        $scope.editing[index] = false;
      }

      $scope.remove = function(index){
        var recipe = $scope.recipes[index];
        Recipes.remove({id: recipe._id}, function(){
          $scope.recipes.splice(index, 1);
        });
      }

    }])

    .controller('RecipeDetailCtrl', ['$scope', '$routeParams', 'Recipes', 'Ingredients', 'Units', '$location', function ($scope, $routeParams, Recipes, Ingredients, Units, $location) {
      $scope.recipe = Recipes.get({id: $routeParams.id }, function(response) {
        for(i=0;i<$scope.recipe.ingredients.length;i++){
          $scope.recipe.ingredients[i].ingredient = Ingredients.get({id: $scope.recipe.ingredients[i].ingredient });
        };
        $scope.recipe.ingredients.push('');
      });


      $scope.units = Units.query();

      $scope.onTypeaheadSelect = function ($item, $model, $label) {
        if(!$scope.recipe.ingredients.filter(function(n){ return n == '' }).length) {
          $scope.recipe.ingredients.push('');
        }
      };

      $scope.GetIngredients = function($viewValue){
        return Ingredients.query({'name.de': $viewValue})
          .$promise.then(function(response) {
            return response;
          });
      }

      $scope.update = function(){
        $scope.recipe.ingredients = $scope.recipe.ingredients.filter(function(n){ return n != ''});
        for(i=0;i<$scope.recipe.ingredients.length;i++){
          $scope.recipe.ingredients[i].ingredient = $scope.recipe.ingredients[i].ingredient._id;
        }
        Recipes.update({id: $scope.recipe._id}, $scope.recipe, function(){
          $location.url('/recipes/');
        });
      }

      $scope.remove = function(){
        Recipes.remove({id: $scope.recipe._id}, function(){
          $location.url('/recipes/');
        });
      }

    }])


    .controller('RecipeAddCtrl', ['$scope', '$routeParams', 'Recipes', 'Ingredients', 'Units', '$location', function ($scope, $routeParams, Recipes, Ingredients, Units, $location) {

      $scope.units = Units.query();

      $scope.recipe = new Recipes();
      $scope.recipe.ingredients = [];
      $scope.recipe.ingredients.push('');

      $scope.onTypeaheadSelect = function ($item, $model, $label) {
        if(!$scope.recipe.ingredients.filter(function(n){ return n == '' }).length) {
          $scope.recipe.ingredients.push('');
        }
      };

      $scope.GetIngredients = function($viewValue){
        return Ingredients.query({'name.de': $viewValue})
        .$promise.then(function(response) {
          return response;
        });
      };


      $scope.save = function(){
        if(!$scope.recipe || $scope.recipe.length < 1) return;
        $scope.recipe.ingredients = $scope.recipe.ingredients.filter(function(n){ return n != ''});
        for(i=0;i<$scope.recipe.ingredients.length;i++){
          $scope.recipe.ingredients[i].ingredient = $scope.recipe.ingredients[i].ingredient._id;
        }
        $scope.recipe.$save(function(){
          $location.url('/recipes/');
        });
      }

    }])


//---------------
// Directives
//---------------

    .directive('navigation', function (routeNavigation) {
      return {
        restrict: "E",
        replace: true,
        templateUrl: "navigation-directive.tpl.html",
        controller:  function ($scope) {
          $scope.hideMobileNav = true;
          $scope.routes = routeNavigation.routes;
          $scope.activeRoute = routeNavigation.activeRoute;
        }
      };
    })

  
//---------------
// Routes
//---------------

  .config(['$routeProvider', function ($routeProvider) {
    $routeProvider
      .when('/', {
        templateUrl: 'startpage.tpl.html',
        controller: 'StartpageController',
      })

      .when('/units/', {
        templateUrl: 'units.tpl.html',
        controller: 'UnitsController',
        name: 'Units'
      })
    
      .when('/units/:id', {
        templateUrl: 'unitdetails.tpl.html',
        controller: 'UnitDetailCtrl'
     })

      .when('/unitadd', {
        templateUrl: 'unitadd.tpl.html',
        controller: 'UnitAddCtrl'
      })


      .when('/ingredients/', {
        templateUrl: 'ingredients.tpl.html',
        controller: 'IngredientsController',
        name: 'Ingredients'
      })
    
      .when('/ingredients/:id', {
        templateUrl: 'ingredientdetails.tpl.html',
        controller: 'IngredientDetailCtrl'
     })

      .when('/ingredientadd', {
        templateUrl: 'ingredientadd.tpl.html',
        controller: 'IngredientAddCtrl'
      })


      .when('/recipes/', {
        templateUrl: 'recipes.tpl.html',
        controller: 'RecipesController',
        name: 'Recipes'
      })
    
      .when('/recipes/:id', {
        templateUrl: 'recipedetails.tpl.html',
        controller: 'RecipeDetailCtrl'
     })

      .when('/recipeadd', {
        templateUrl: 'recipeadd.tpl.html',
        controller: 'RecipeAddCtrl'
      })
    ;
  }]);
