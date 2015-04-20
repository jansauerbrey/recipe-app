angular.module('app', ['ngRoute', 'ngResource', 'ui.bootstrap', 'ui.checkbox'])

//---------------
// Services
//---------------


// Auth

    .factory('AuthenticationService', function($window) {
        var auth = {
            isAuthenticated: false,
            isAdmin: false
        }
        return auth;
    })

    .factory('UserService', function($http) {
        return {
            logIn: function(username, password) {
                return $http.post('/api/user/login', {username: username, password: password});
            },

            logOut: function() {
                return $http.get('/api/user/logout');
            },

            register: function(username, password, passwordConfirmation) {
                return $http.post('/api/user/register', {username: username, password: password, passwordConfirmation: passwordConfirmation });
            }

        }
    })


    .factory('TokenInterceptor', function ($q, $window, $location, AuthenticationService) {
        return {
            request: function (config) {
                config.headers = config.headers || {};
                if ($window.sessionStorage.token) {
                    config.headers.Authorization = 'AUTH ' + $window.sessionStorage.token;
                }
                return config;
            },

            requestError: function(rejection) {
                return $q.reject(rejection);
            },

            /* Set Authentication.isAuthenticated to true if 200 received */
            response: function (response) {
                if (response != null && response.status == 200 && $window.sessionStorage.token && !AuthenticationService.isAuthenticated) {
                    AuthenticationService.isAuthenticated = true;
                    $window.sessionStorage.isAuthenticated = true;
                }
                return response || $q.when(response);
            },

            /* Revoke client authentication if 401 is received */
            responseError: function(rejection) {
                if (rejection != null && rejection.status === 401 && ($window.sessionStorage.token || AuthenticationService.isAuthenticated)) {
                    delete $window.sessionStorage.token;
                    delete $window.sessionStorage.isAdmin;
                    delete $window.sessionStorage.isAuthenticated;
                    AuthenticationService.isAuthenticated = false;
                    AuthenticationService.isAdmin = false;
                    $location.path("/user/login");
                }

                return $q.reject(rejection);
            }
        };
    })

// Navigation

    .factory('routeNavigation', function($route, $location, AuthenticationService) {
        var routes = [];
        angular.forEach($route.routes, function (route, path) {
            if (route.name) {
		var requiredAdmin = (route.access.requiredAdmin === true) ? true : false;
                routes.push({
                    path: path,
                    name: route.name,
                    requiredAuthentication: route.access.requiredAuthentication,
                    requiredAdmin: requiredAdmin
                });
            }
        });
        return {
            routes: routes,
            activeRoute: function (route) {
                return route.path === $location.path();
            },
            hiddenRoute: function (route) {
		if (route.requiredAdmin === false) {
                    return (AuthenticationService.isAuthenticated !== route.requiredAuthentication);
                }
                else if (route.requiredAdmin === true && AuthenticationService.isAdmin === true && AuthenticationService.isAuthenticated === true) {
                    return false;
                }
                else return true;
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

        .factory('Schedules', ['$resource', function($resource){
          return $resource('/api/schedules/:id', null, {
            'update': { method:'PUT' }
          });
        }])

        .factory('Users', ['$resource', function($resource){
          return $resource('/api/admin/user/:id', null, {
            'update': { method:'PUT' }
          });
        }])

//---------------
// Controllers
//---------------


// Auth

    .controller('UserCtrl', ['$scope', '$location', '$window', 'UserService', 'AuthenticationService',
        function UserCtrl($scope, $location, $window, UserService, AuthenticationService) {
 
        //Admin User Controller (login, logout, register)
        $scope.logIn = function logIn(username, password) {
            if (username !== undefined && password !== undefined) {
 
                UserService.logIn(username, password).success(function(data) {
                    AuthenticationService.isAuthenticated = true;
                    AuthenticationService.isAdmin = data.is_admin;
                    $window.sessionStorage.isAuthenticated = true;
                    $window.sessionStorage.isAdmin = data.is_admin;
                    $window.sessionStorage.token = data.token;
                    $location.path("/");
                }).error(function(status, data) {
                    console.log(status);
                    console.log(data);
                    $location.path("/user/register");
                });
            }
        }
 
        $scope.register = function register(username, password, passwordConfirm) {
            if (AuthenticationService.isAuthenticated) {
                $location.path("/");
            }
            else {
                UserService.register(username, password, passwordConfirm).success(function(data) {
                    $location.path("/");
                }).error(function(status, data) {
                    console.log(status);
                    console.log(data);
                });
            }
        }

    }])



    .controller('UserLogout', ['$scope', '$location', '$window', 'UserService', 'AuthenticationService',
        function UserLogout($scope, $location, $window, UserService, AuthenticationService) {
 
        //Admin User Controller (logout)
        if (AuthenticationService.isAuthenticated) {
            UserService.logOut().success(function(data) {
                AuthenticationService.isAuthenticated = false;
                delete $window.sessionStorage.token;
            }).error(function(status, data) {
                console.log(status);
                console.log(data);
            });
        }
        else {
            $location.path("/user/login");
        }
    }])


// Start Page


    .controller('StartpageController', ['$scope', function ($scope) {
    }])


// Admin

    .controller('AdminUserCtrl', ['$scope', '$location', 'Users', function ($scope, $location, Users) {
      $scope.loading = true;
      $scope.users = Users.query(function(response) {
        $scope.loading = false;
      });

      $scope.remove = function(index){
        Users.remove({id: $scope.users[index]._id}, function(){
          $scope.users.splice(index, 1);
        });
      }

      $scope.makeAdmin = function(index){
        $scope.users[index].is_admin = true;
        Users.update({id: $scope.users[index]._id}, {is_admin: true}, function(){
        });
      }

      $scope.removeAdmin = function(index){
        $scope.users[index].is_admin = false;
        Users.update({id: $scope.users[index]._id}, {is_admin: false}, function(){
        });
      }

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


// Schedules

    .controller('SchedulesController', ['$scope', '$routeParams', 'Schedules', 'Recipes', function ($scope, $routeParams, Schedules, Recipes) {
      if (!$routeParams.date) {
        $scope.startDate = new Date();
        $scope.endDate = new Date();
        $scope.endDate.setDate($scope.startDate.getDate() + 6);
      }
      else {
        $scope.startDate = new Date($routeParams.date);
        $scope.endDate = new Date($routeParams.date);
      }
      // remove hours
      $scope.startDate.setHours(0, 0, 0, 0);
      $scope.endDate.setHours(0, 0, 0, 0);
      $scope.loading = true;
      

      $scope.updateSchedules = function(startDate, endDate){
        schedules = [];
        while(startDate <= endDate) {
          var nextStartDate = new Date(startDate);
          nextStartDate.setDate(nextStartDate.getDate() + 1);
          schedules.push({date: startDate, recipes: Schedules.query({startDate: startDate, endDate: nextStartDate})});
          startDate = nextStartDate;
        }
        $scope.schedules = schedules;
      }
      $scope.updateSchedules($scope.startDate, $scope.endDate);

      $scope.GetRecipes = function($viewValue){
        return Recipes.query({name: $viewValue})
          .$promise.then(function(response) {
            return response;
          });
      }

      $scope.addRecipe = function(){
        if(!$scope.newrecipe || $scope.newrecipe.length < 1) return;
        if(!$scope.newfactor || $scope.newfactor.length < 1){
          $scope.newfactor = $scope.newrecipe.yield;
        };
        var addedRecipe = new Schedules({date: $scope.startDate.setHours(12), recipe_id: $scope.newrecipe.recipe_id, name: $scope.newrecipe.name, factor: $scope.newfactor});
        addedRecipe.$save(function(response){
          $scope.schedules[0].recipes.push(response);
          $scope.newrecipe = null;
        });
      }

      $scope.remove = function(index){
        Schedules.remove({id: $scope.schedules[0].recipes[index]._id}, function(){
          $scope.schedules[0].recipes.splice(index, 1);
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
          $scope.hiddenRoute = routeNavigation.hiddenRoute;
        }
      };
    })

  
//---------------
// Token Interceptor
//---------------

   .config(function ($httpProvider) {
       $httpProvider.interceptors.push('TokenInterceptor');
   })


//---------------
// Routes
//---------------

  .config(['$routeProvider', function ($routeProvider) {
    $routeProvider
      .when('/', {
        templateUrl: 'startpage.tpl.html',
        controller: 'StartpageController',
        access: { requiredAuthentication: true }
      })

      .when('/units/', {
        templateUrl: 'units.tpl.html',
        controller: 'UnitsController',
        name: 'Units',
        access: { requiredAuthentication: true }
      })
    
      .when('/units/:id', {
        templateUrl: 'unitdetails.tpl.html',
        controller: 'UnitDetailCtrl',
        access: { requiredAuthentication: true }
     })

      .when('/unitadd', {
        templateUrl: 'unitadd.tpl.html',
        controller: 'UnitAddCtrl',
        access: { requiredAuthentication: true }
      })


      .when('/ingredients/', {
        templateUrl: 'ingredients.tpl.html',
        controller: 'IngredientsController',
        name: 'Ingredients',
        access: { requiredAuthentication: true }
      })
    
      .when('/ingredients/:id', {
        templateUrl: 'ingredientdetails.tpl.html',
        controller: 'IngredientDetailCtrl',
        access: { requiredAuthentication: true }
     })

      .when('/ingredientadd', {
        templateUrl: 'ingredientadd.tpl.html',
        controller: 'IngredientAddCtrl',
        access: { requiredAuthentication: true }
      })


      .when('/recipes/', {
        templateUrl: 'recipes.tpl.html',
        controller: 'RecipesController',
        name: 'Recipes',
        access: { requiredAuthentication: true }
      })
    
      .when('/recipes/:id', {
        templateUrl: 'recipedetails.tpl.html',
        controller: 'RecipeDetailCtrl',
        access: { requiredAuthentication: true }
     })

      .when('/recipeadd', {
        templateUrl: 'recipeadd.tpl.html',
        controller: 'RecipeAddCtrl',
        access: { requiredAuthentication: true }
      })

      .when('/schedules/', {
        templateUrl: 'schedules.tpl.html',
        controller: 'SchedulesController',
        name: 'Schedules',
        access: { requiredAuthentication: true }
      })

      .when('/schedules/:date', {
        templateUrl: 'schedules.date.tpl.html',
        controller: 'SchedulesController',
        access: { requiredAuthentication: true }
      })
    
      .when('/scheduleadd', {
        templateUrl: 'scheduleadd.tpl.html',
        controller: 'ScheduleAddCtrl',
        access: { requiredAuthentication: true }
      })

      .when('/admin/user', {
        templateUrl: 'admin.user.tpl.html',
        controller: 'AdminUserCtrl',
        name: 'Admin',
        access: { requiredAuthentication: true,
                  requiredAdmin: true }
      })

      .when('/user/register', {
        templateUrl: 'register.tpl.html',
        controller: 'UserCtrl',
        name: 'Register',
        access: { requiredAuthentication: false }
      })

      .when('/user/login', {
        templateUrl: 'login.tpl.html',
        controller: 'UserCtrl',
        name: 'Login',
        access: { requiredAuthentication: false }
      })

      .when('/user/logout', {
        templateUrl: 'logout.tpl.html',
        controller: 'UserLogout',
        name: 'Logout',
        access: { requiredAuthentication: true }
      })

    ;
  }])

    .run(function($rootScope, $location, $window, AuthenticationService) {
        $rootScope.$on("$routeChangeStart", function(event, nextRoute, currentRoute) {
            //redirect only if both isAuthenticated is false and no token is set
            if (nextRoute != null && nextRoute.access != null && nextRoute.access.requiredAuthentication 
                && !AuthenticationService.isAuthenticated && !$window.sessionStorage.token) {

                $location.path("/user/login");
            }
        });
    })

;
