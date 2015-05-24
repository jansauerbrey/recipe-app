angular.module('app', ['ngRoute', 'ngResource', 'ngStorage', 'ui.bootstrap', 'ui.checkbox', 'ngTagsInput'])



//---------------
// Services
//---------------


// Auth

    .factory('AuthenticationService', function($window) {
        var auth = {
            isAuthenticated: false,
            isAdmin: false,
            user: '',
        }
        if ($window.localStorage.isAdmin) {
          auth.isAdmin = true;
        }
        if ($window.localStorage.user) {
          auth.user = $window.localStorage.user;
        }
        return auth;
    })

    .factory('TokenInterceptor', function ($q, $window, $location, AuthenticationService) {
        return {
            request: function (config) {
                config.headers = config.headers || {};
                if ($window.localStorage.token) {
                    config.headers.Authorization = 'AUTH ' + $window.localStorage.token;
                }
                return config;
            },

            requestError: function(rejection) {
                return $q.reject(rejection);
            },

            /* Set Authentication.isAuthenticated to true if 200 received */
            response: function (response) {
                if (response != null && response.status == 200 && $window.localStorage.token && !AuthenticationService.isAuthenticated) {
                    AuthenticationService.isAuthenticated = true;
                    $window.localStorage.isAuthenticated = true;
                    AuthenticationService.isAdmin = $window.localStorage.isAdmin;
                }
                return response || $q.when(response);
            },

            /* Revoke client authentication if 401 is received */
            responseError: function(rejection) {
                if (rejection != null && rejection.status === 401 && ($window.localStorage.token || AuthenticationService.isAuthenticated)) {
                    delete $window.localStorage.token;
                    delete $window.localStorage.isAdmin;
                    delete $window.localStorage.isAuthenticated;
                    delete $window.localStorage.user;
                    AuthenticationService.isAuthenticated = false;
                    AuthenticationService.isAdmin = false;
                    AuthenticationService.user = null;
                    $location.path("/user/login");
                }

                return $q.reject(rejection);
            }
        };
    })

// Navigation

    .factory('routeNavigation', function($route, $location, $window, AuthenticationService) {
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

        var subroutes = [];
        angular.forEach($route.routes, function (route, path) {
            if (route.subname) {
		var requiredAdmin = (route.access.requiredAdmin === true) ? true : false;
                subroutes.push({
                    path: path,
                    name: route.subname,
                    requiredAuthentication: route.access.requiredAuthentication,
                    requiredAdmin: requiredAdmin
                });
            }
        });

        var userroutes = [];
        angular.forEach($route.routes, function (route, path) {
            if (route.username) {
		var requiredAdmin = (route.access.requiredAdmin === true) ? true : false;
                userroutes.push({
                    path: path,
                    name: route.username,
                    requiredAuthentication: route.access.requiredAuthentication,
                    requiredAdmin: requiredAdmin
                });
            }
        });

        return {
            routes: routes,
            subroutes: subroutes,
            userroutes: userroutes,
            user: $window.localStorage.user,
            activeRoute: function (route) {
                return route.path === $location.path();
            },
            hiddenRoute: function (route) {
		if (!route){
                    return (!AuthenticationService.isAuthenticated);
                }
                else if (route.requiredAdmin === false) {
                    return (AuthenticationService.isAuthenticated !== route.requiredAuthentication);
                }
                else if (route.requiredAdmin === true && AuthenticationService.isAdmin === true && AuthenticationService.isAuthenticated === true) {
                    return false;
                }
                else return true;
            }
        };
    })

    .factory('UserService', [ '$http', function($http) {
        return {
            logIn: function(username, password, autologin) {
                return $http.post('http://rezept-planer.de/api/user/login', {username: username, password: password, autologin: autologin});
            },

            logOut: function() {
                return $http.get('http://rezept-planer.de/api/user/logout');
            },

            register: function(user) {
                return $http.post('http://rezept-planer.de/api/user/register', user);
            }

        }
    }])

        .factory('User', ['$resource', function($resource){
          return $resource('http://rezept-planer.de/api/user/info/:id');
        }])

        .factory('Units', ['$resource', function($resource){
          return $resource('http://rezept-planer.de/api/units/:id', null, {
            'update': { method:'PUT' }
          });
        }])

        .factory('Ingredients', ['$resource', function($resource){
          return $resource('http://rezept-planer.de/api/ingredients/:id', null, {
            'update': { method:'PUT' }
          });
        }])

        .factory('Categories', ['$resource', function($resource){
          return $resource('http://rezept-planer.de/api/categories/:id', null, {
            'update': { method:'PUT' }
          });
        }])

        .factory('TAIngredients', ['$resource', function($resource){
          return $resource('http://rezept-planer.de/api/typeahead/ingredients/', null, {
            'search': { method:'GET', isArray: true }
          });
        }])

        .factory('Tags', ['$resource', function($resource){
          return $resource('http://rezept-planer.de/api/tags/:id', null, {
            'update': { method:'PUT' }
          });
        }])

        .factory('TATags', ['$resource', function($resource){
          return $resource('http://rezept-planer.de/api/typeahead/tags/', null, {
            'search': { method:'GET', isArray: true }
          });
        }])

        .factory('Recipes', ['$resource', function($resource){
          return $resource('http://rezept-planer.de/api/recipes/:id', null, {
            'update': { method:'PUT' }
          });
        }])

        .factory('TARecipes', ['$resource', function($resource){
          return $resource('http://rezept-planer.de/api/typeahead/recipes/', null, {
            'search': { method:'GET', isArray: true }
          });
        }])

        .factory('Schedules', ['$resource', function($resource){
          return $resource('http://rezept-planer.de/api/schedules/:id', null, {
            'update': { method:'PUT' }
          });
        }])


        .factory('Shopitems', ['$resource', function($resource){
          return $resource('http://rezept-planer.de/api/shopitems/:id', null, {
            'update': { method:'PUT' }
          });
        }])

        .factory('Users', ['$resource', function($resource){
          return $resource('http://rezept-planer.de/api/admin/user/:id', null, {
            'update': { method:'PUT' }
          });
        }])

//---------------
// Controllers
//---------------


// Auth

    .controller('UserCtrl', ['$scope', '$location', '$window', 'Users', 'UserService', 'AuthenticationService',
        function UserCtrl($scope, $location, $window, Users, UserService, AuthenticationService) {
 
        $scope.logIn = function logIn(username, password, autologin) {
            if (username !== undefined && password !== undefined) {
 
                UserService.logIn(username, password, autologin).success(function(data) {
                    AuthenticationService.isAuthenticated = true;
                    AuthenticationService.isAdmin = data.is_admin;
                    AuthenticationService.user = data;
                    $window.localStorage.isAuthenticated = true;
                    $window.localStorage.isAdmin = data.is_admin;
                    $window.localStorage.token = data.token;
                    $window.localStorage.user = data;
                    $location.path("/");
                }).error(function(status, data) {
                    console.log(status);
                    console.log(data);
                    $location.path("/user/register");
                });
            }
        }
 
        $scope.user = new Users();

        $scope.register = function register() {
            if (AuthenticationService.isAuthenticated) {
                $location.path("/");
            }
            else {
                UserService.register($scope.user).success(function(data) {
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
                    delete $window.localStorage.token;
                    delete $window.localStorage.isAdmin;
                    delete $window.localStorage.isAuthenticated;
                    delete $window.localStorage.user;
                    AuthenticationService.isAuthenticated = false;
                    AuthenticationService.isAdmin = false;
                    AuthenticationService.user = '';
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


// Impressum


    .controller('ImpressumController', ['$scope', function ($scope) {
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

      $scope.activate = function(index){
        $scope.users[index].is_activated = true;
        Users.update({id: $scope.users[index]._id}, {is_activated: true}, function(){
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
      if (!$routeParams.id) {}
      else $scope.unit = Units.get({id: $routeParams.id });

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

    .controller('IngredientDetailCtrl', ['$scope', '$routeParams', 'Ingredients', 'Categories', '$location', function ($scope, $routeParams, Ingredients, Categories, $location) {
      $scope.categories = Categories.query();
      $scope.selectedcategory = {};

      if (!$routeParams.id) {}
      else $scope.ingredient = Ingredients.get({id: $routeParams.id }, function(response){
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
          $location.url('/ingredients/');
        });
      }

      $scope.remove = function(){
        Ingredients.remove({id: $scope.ingredient._id}, function(){
          $location.url('/ingredients/');
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
          $location.url('/ingredients/');
        });
      }

    }])


// Recipes

    .controller('RecipesController', ['$scope', 'Recipes', 'Tags', function ($scope, Recipes, Tags) {
      $scope.editing = [];
      $scope.tagfilter = {};
      $scope.loading = true;
      $scope.hideAdvSearch = true;
      $scope.status = {};
      $scope.status.tags = true;

      $scope.tags = Tags.query();

      $scope.recipes = Recipes.query(function(response) {
        $scope.loading = false;
      });

      $scope.filterByTags = function(recipe) {
        var match = true;
        angular.forEach($scope.tagfilter, function(value, key) {
          if (value === true){
            var subMatch = false;
            for(i=0;i<recipe.tags.length;i++){
              if(key ===recipe.tags[i].text){
                subMatch =true;
                break;
              }
            }
            match = match && subMatch;
          }
        });
        return match;
      }

    }])

    .controller('RecipeDetailCtrl', ['$scope', '$routeParams', '$modal', 'AuthenticationService', 'Recipes', 'Tags', 'Ingredients', 'Units', '$location', 'TAIngredients', 'TATags', function ($scope, $routeParams, $modal, AuthenticationService, Recipes, Tags, Ingredients, Units, $location, TAIngredients, TATags) {
      $scope.allowEdit = false;
      $scope.alerts = [];
      $scope.submitted = false;

      if (!$routeParams.id) {
        $scope.recipe = new Recipes();
        $scope.recipe.ingredients = [];
        $scope.recipe.ingredients.push({qty: '', unit: '', ingredient: ''});
      } else {
        $scope.recipe = Recipes.get({id: $routeParams.id }, function(response) {
          $scope.recipe.ingredients.push({qty: '', unit: '', ingredient: ''});
          if (AuthenticationService.user._id == response.author._id || AuthenticationService.user.is_admin === true) {
            $scope.allowEdit = true;
          }
        });
      }

      $scope.units = Units.query();

      $scope.onTypeaheadSelect = function ($item, $model, $label) {
        if(!$scope.recipe.ingredients.filter(function(n){ return n == '' }).length) {
          $scope.recipe.ingredients.push({qty: '', unit: '', ingredient: ''});
        }
      };

      $scope.GetIngredients = function(viewValue){
        return TAIngredients.search({search: viewValue, language: $scope.recipe.language})
        .$promise.then(function(response) {
          return response;
        });
      };

      $scope.addTag = function(tag){
        if (!tag._id){
          var newtag = new Tags(tag)
          newtag.$save( function(response){
            var l = $scope.recipe.tags.length;
            $scope.recipe.tags[l-1] = response;
          });
        }
      };



      $scope.update = function(){
        $scope.recipe.ingredients = $scope.recipe.ingredients.filter(function(n){ return n != ''});
        for(i=0;i<$scope.recipe.tags.length;i++){
          if (!$scope.recipe.tags[i]._id){
            var tag = new Tags($scope.recipe.tags[i]);
            tag.$save();
            $scope.recipe.tags[i] = tag._id;
          }
        }
        for(i=0;i<$scope.recipe.ingredients.length;i++){
          if (!($scope.recipe.ingredients[i].ingredient && $scope.recipe.ingredients[i].ingredient._id)) {
            $scope.recipe.ingredients.splice(i, 1);
          }
        }
        Recipes.update({id: $scope.recipe._id}, $scope.recipe, function(){
          $location.url('/recipes/');
        });
      }

      $scope.cancel = function(){
        $scope.recipe = Recipes.get({id: $routeParams.id }, function(response) {
          $scope.recipe.ingredients.push('');
          $scope.recipeedit = false;
        });
        
      }

      $scope.remove = function(){
        Recipes.remove({id: $scope.recipe._id}, function(){
          $location.url('/recipes/');
        });
      }

      $scope.save = function(validForm){
        if(!validForm){
          $scope.submitted = true;
          return;
        }
        if(!$scope.recipe || $scope.recipe.length < 1) return;
        $scope.recipe.ingredients = $scope.recipe.ingredients.filter(function(n){ return n != ''});
        for(i=0;i<$scope.recipe.tags.length;i++){
          if (!$scope.recipe.tags[i]._id){
            var tag = new Tags($scope.recipe.tags[i]);
            tag.$save();
            $scope.recipe.tags[i] = tag._id;
          }
        }
        for(i=0;i<$scope.recipe.ingredients.length;i++){
          if (!($scope.recipe.ingredients[i].ingredient && $scope.recipe.ingredients[i].ingredient._id)) {
            $scope.recipe.ingredients.splice(i, 1);
          }
        }
        $scope.recipe.$save(function(){
          $location.url('/recipes/');
        });
      }

      $scope.loadTags = function(viewValue) {
        return TATags.search({search: viewValue}).$promise.then(function(response) {
          return response;
        });
      }

      $scope.scheduleAdd = function() {
        var modalAddSchedule = $modal.open({
          animation: true,
          templateUrl: 'partials/recipes.scheduleadd.tpl.html',
          controller: 'ModalScheduleAddController',
          size: 'xs',
          resolve: {
            recipe: function(){
              return $scope.recipe;
            }
          }
        });

        modalAddSchedule.result.then(function(successMsg){
          $scope.alerts.push(successMsg);
        });

      }

      $scope.closeAlert = function(index){
        $scope.alerts.splice(index, 1);
      }


    }])


    .controller('ModalScheduleAddController', ['$scope', '$routeParams', '$modalInstance', '$filter', 'Schedules', 'recipe', function ($scope, $routeParams, $modalInstance, $filter, Schedules, recipe) {
      $scope.recipe = recipe;
      $scope.date = new Date();
      $scope.factor = $scope.recipe.yield;
     
      $scope.ok = function(){
        var newSchedule = new Schedules({date: $scope.date.setHours(12), recipe: $scope.recipe, factor: $scope.factor});
        newSchedule.$save(function(response){
          var message = 'The recipe '+$scope.recipe.name+' was successfully scheduled for the '+$filter('date')($scope.date, 'dd.MM.yyyy')+' with '+$scope.factor+' persons.';
          $modalInstance.close({type: 'success', msg: message});
        });
      }

      $scope.cancel = function(){
        $modalInstance.dismiss('cancel');
      }


      $scope.openDate = function($event) {
        $event.preventDefault();
        $event.stopPropagation();

        $scope.calendarIsOpen = true;
      };


    }])



// Schedules

    .controller('SchedulesController', ['$scope', '$routeParams', 'Schedules', 'TARecipes', function ($scope, $routeParams, Schedules, TARecipes) {

      $scope.edit = [];

      if (!$routeParams.date) {
        $scope.startDate = new Date();
        $scope.endDate = new Date();
        $scope.endDate.setDate($scope.startDate.getDate() + 6);
      }
      else {
        $scope.startDate = new Date($routeParams.date);
        $scope.endDate = new Date($routeParams.date);
        $scope.prevDate = new Date($routeParams.date);
        $scope.nextDate = new Date($routeParams.date);
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

      $scope.remove = function(index){
        Schedules.remove({id: $scope.schedulesArray[0].schedule[index]._id}, function(){
          $scope.schedulesArray[0].schedule.splice(index, 1);
        });
      }


      $scope.update = function(index){
        Schedules.update({id: $scope.schedulesArray[0].schedule[index]._id}, $scope.schedulesArray[0].schedule[index], function(){
          $scope.edit[index] = false;
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


// Shopitems

    .controller('ShopitemsController', ['$scope', '$routeParams', '$modal', 'Shopitems', 'TAIngredients', 'Units', '$location', '$filter', function ($scope, $routeParams, $modal, Shopitems, TAIngredients, Units, $location, $filter) {

      containsObj = function(array, obj) {
        var i, l = array.length;
        for (i=0;i<array.length;i++)
        {
          if (angular.equals(array[i], obj)) return i;
        }
        return false;
      };

      $scope.loading = true;

      Shopitems.query(function(response) {
        $scope.loading = false;
        
        var uniqueIngredients = [];
        var uniqueIngredientsTemp = [];
        for(i=0;i<response.length;i++){
          var index = containsObj(uniqueIngredientsTemp, {ingredient:response[i].ingredient, unit:response[i].unit, completed: response[i].completed});
          if ( index === false) {
            uniqueIngredientsTemp.push({ingredient:response[i].ingredient, unit:response[i].unit, completed: response[i].completed});
            var obj = {ingredient:response[i].ingredient, unit:response[i].unit, completed: response[i].completed};
            obj.details = [response[i]];
            obj.amount = response[i].amount;
            uniqueIngredients.push(obj);
          }
          else {
            uniqueIngredients[index].details.push(response[i]);
            uniqueIngredients[index].amount = response[i].amount + uniqueIngredients[index].amount;
          }
        }
        $scope.shopitems = uniqueIngredients;
      });

      $scope.units = Units.query();

      $scope.GetIngredients = function(viewValue){
        return TAIngredients.search({search: viewValue, language: 'de'})
        .$promise.then(function(response) {
          return response;
        });
      };

      $scope.addShopitem = function(){
        var expDate = new Date();
        expDate.setDate(expDate.getDate() + 14);
        expDate.setHours(0, 0, 0, 0);
        for(i=0;i<$scope.units.length;i++){
          if($scope.units[i]._id === $scope.newunit) {
            $scope.newunitobject = $scope.units[i];
          }
        }
        var newshopitem = new Shopitems({ingredient: $scope.newingredient, unit: $scope.newunitobject, amount: $scope.newamount, completed: false , expire_date: expDate });
        newshopitem.$save();
        obj = {ingredient: newshopitem.ingredient, unit: newshopitem.unit, completed: newshopitem.completed};
        obj.details = [newshopitem];
        obj.amount = newshopitem.amount;
        $scope.shopitems.push(obj);
        $scope.newingredient = "";
        $scope.newunit = "";
        $scope.newamount = "";
      }

      $scope.removeItem = function(item){
        $scope.items.splice($scope.items.indexOf(item),1);
      }


      $scope.remove = function(item){
        for(i=0;i<item.details.length;i++){
          Shopitems.remove({id: item.details[i]._id});
        }
        $scope.shopitems.splice($scope.shopitems.indexOf(item), 1);
      }

      $scope.complete = function(item){
        for(i=0;i<item.details.length;i++){
          $scope.shopitems[$scope.shopitems.indexOf(item)].details[i].completed = item.completed;
          Shopitems.update({id: item.details[i]._id}, item.details[i]);
        }
      }


      $scope.modalShopitemAdd = function() {
        var modalAddShopitem = $modal.open({
          animation: true,
          templateUrl: 'partials/shopitems.modal.add.tpl.html',
          controller: 'ModalShopitemAddController',
          size: 'xs',
          resolve: {
            units: function(){
              return $scope.units;
            }
          }
        });

        modalAddShopitem.result.then(function(response){
          $scope.newamount = response.amount;
          $scope.newunit = response.unit;
          $scope.newingredient = response.ingredient;
          $scope.addShopitem();
        });

      }

    }])


    .controller('ModalShopitemAddController', ['$scope', '$routeParams', '$modalInstance', 'TAIngredients', 'units', function ($scope, $routeParams, $modalInstance, TAIngredients, units) {
     
      $scope.units = units;

      $scope.GetIngredients = function(viewValue){
        return TAIngredients.search({search: viewValue, language: 'de'})
        .$promise.then(function(response) {
          return response;
        });
      };

      $scope.ok = function(){
        $modalInstance.close({amount: $scope.newamount, unit: $scope.newunit, ingredient: $scope.newingredient});
      }

      $scope.cancel = function(){
        $modalInstance.dismiss('cancel');
      }


    }])



// Cooking

    .controller('CookingController', ['$scope', '$routeParams', 'Schedules', 'Recipes', 'Ingredients', 'Units', 'Tags', 'User', '$location', function ($scope, $routeParams, Schedules, Recipes, Ingredients, Units, Tags, User, $location) {
      if (!$routeParams.date) {
        $scope.startDate = new Date();
      }
      else {
        $scope.startDate = new Date($routeParams.date);
      }

      $scope.startDate.setHours(0, 0, 0, 0);

      $scope.endDate = new Date($scope.startDate);
      $scope.prevDate = new Date($scope.startDate);
      $scope.nextDate = new Date($scope.startDate);
      $scope.endDate.setDate($scope.endDate.getDate() + 1);
      $scope.prevDate.setDate($scope.prevDate.getDate() - 1);
      $scope.nextDate.setDate($scope.nextDate.getDate() + 1);


      $scope.schedules = Schedules.query({startDate: $scope.startDate, endDate: $scope.endDate}, function(response){
        for(i=0;i<response.length;i++){
          for(j=0;j<response[i].recipe.tags.length;j++){
            response[i].recipe.tags[j] = Tags.get({id: response[i].recipe.tags[j] });
          }
          for(j=0;j<response[i].recipe.ingredients.length;j++){
            response[i].recipe.ingredients[j].ingredient = Ingredients.get({id: response[i].recipe.ingredients[j].ingredient });
            response[i].recipe.ingredients[j].unit = Units.get({id: response[i].recipe.ingredients[j].unit });
          }
          // does not work yet
          $scope.schedules[i].recipe.author = User.get({id: response[i].recipe.author});
        }
        return response;
      });

    }])


//---------------
// Directives
//---------------

    .directive('navigation', ['routeNavigation', function (routeNavigation) {
      return {
        restrict: "E",
        replace: true,
        templateUrl: "partials/navigation-directive.tpl.html",
        controller:  function ($scope) {
          $scope.hideMobileNav = true;
          $scope.user = routeNavigation.user;
          $scope.routes = routeNavigation.routes;
          $scope.subroutes = routeNavigation.subroutes;
          $scope.userroutes = routeNavigation.userroutes;
          $scope.activeRoute = routeNavigation.activeRoute;
          $scope.hiddenRoute = routeNavigation.hiddenRoute;;
        }
      };
    }])


    .directive('ngReallyClick', [function() {
    return {
        restrict: 'A',
        link: function(scope, element, attrs) {
            element.bind('click', function() {
                var message = attrs.ngReallyMessage;
                if (message && confirm(message)) {
                    scope.$apply(attrs.ngReallyClick);
                }
            });
        }
    }
    }])


//---------------
// Token Interceptor
//---------------

   .config(function ($httpProvider) {
       $httpProvider.interceptors.push('TokenInterceptor');
   })


    .filter('sumFilter', function() {
      return function(items, value) {
        var summary = 0; 
        for (var i in items) {
          if (items[i].priority == value) {
            summary++;
          }
        }
        return summary;
      }
    })

    .filter('unique', function() {
      return function(items, key) {
        var unique = {};
        var uniqueList = [];
        for(var i = 0; i < items.length; i++){
          if(typeof unique[items[i][key]] == "undefined") {
            unique[items[i][key]] = "";
            uniqueList.push(items[i]);
          }
        }
        return uniqueList;
      };
    })

//---------------
// Routes
//---------------

  .config(['$routeProvider', function ($routeProvider) {
    $routeProvider
      .when('/', {
        templateUrl: 'partials/startpage.tpl.html',
        controller: 'StartpageController',
        access: { requiredAuthentication: true }
      })

      .when('/units/', {
        templateUrl: 'partials/units.tpl.html',
        controller: 'UnitsController',
        subname: 'Units',
        access: { requiredAuthentication: true }
      })
    
      .when('/units/edit/:id', {
        templateUrl: 'partials/units.details.tpl.html',
        controller: 'UnitDetailCtrl',
        access: { requiredAuthentication: true }
     })

      .when('/units/add/', {
        templateUrl: 'partials/units.add.tpl.html',
        controller: 'UnitDetailCtrl',
        access: { requiredAuthentication: true }
      })


      .when('/ingredients/', {
        templateUrl: 'partials/ingredients.tpl.html',
        controller: 'IngredientsController',
        subname: 'Ingredients',
        access: { requiredAuthentication: true }
      })
    
      .when('/ingredients/edit/:id', {
        templateUrl: 'partials/ingredients.details.tpl.html',
        controller: 'IngredientDetailCtrl',
        access: { requiredAuthentication: true }
     })

      .when('/ingredients/add/', {
        templateUrl: 'partials/ingredients.add.tpl.html',
        controller: 'IngredientDetailCtrl',
        access: { requiredAuthentication: true }
      })


      .when('/recipes/', {
        templateUrl: 'partials/recipes.tpl.html',
        controller: 'RecipesController',
        subname: 'Recipes',
        access: { requiredAuthentication: true }
      })
    
      .when('/recipes/edit/:id', {
        templateUrl: 'partials/recipes.edit.tpl.html',
        controller: 'RecipeDetailCtrl',
        access: { requiredAuthentication: true }
     })

      .when('/recipes/add/', {
        templateUrl: 'partials/recipes.add.tpl.html',
        controller: 'RecipeDetailCtrl',
        access: { requiredAuthentication: true }
      })

      .when('/schedules/', {
        templateUrl: 'partials/schedules.tpl.html',
        controller: 'SchedulesController',
        name: 'Schedules',
        access: { requiredAuthentication: true }
      })

      .when('/schedules/:date', {
        templateUrl: 'partials/schedules.date.tpl.html',
        controller: 'SchedulesController',
        access: { requiredAuthentication: true }
      })

      .when('/shopitems/', {
        templateUrl: 'partials/shopitems.tpl.html',
        controller: 'ShopitemsController',
        name: 'Shopping List',
        access: { requiredAuthentication: true }
      })

      .when('/cooking/', {
        templateUrl: 'partials/cooking.date.tpl.html',
        controller: 'CookingController',
        name: 'Cooking',
        access: { requiredAuthentication: true }
      })

      .when('/cooking/:date', {
        templateUrl: 'partials/cooking.date.tpl.html',
        controller: 'CookingController',
        access: { requiredAuthentication: true }
      })
    
      .when('/admin/user/', {
        templateUrl: 'partials/admin.user.tpl.html',
        controller: 'AdminUserCtrl',
        subname: 'Admin',
        access: { requiredAuthentication: true,
                  requiredAdmin: true }
      })

      .when('/impressum/', {
        templateUrl: 'partials/impressum.tpl.html',
        controller: 'ImpressumController',
        subname: 'Impressum',
        access: { requiredAuthentication: true }
      })

      .when('/user/register/', {
        templateUrl: 'partials/user.register.tpl.html',
        controller: 'UserCtrl',
        username: 'Register',
        access: { requiredAuthentication: false }
      })

      .when('/user/login/', {
        templateUrl: 'partials/user.login.tpl.html',
        controller: 'UserCtrl',
        username: 'Login',
        access: { requiredAuthentication: false }
      })

      .when('/user/logout/', {
        templateUrl: 'partials/user.logout.tpl.html',
        controller: 'UserLogout',
        username: 'Logout',
        access: { requiredAuthentication: true }
      })

    ;
  }])

    .run(function($rootScope, $location, $window, AuthenticationService) {
        $rootScope.$on("$routeChangeStart", function(event, nextRoute, currentRoute) {
            //redirect only if both isAuthenticated is false and no token is set
            if (nextRoute != null && nextRoute.access != null && nextRoute.access.requiredAuthentication 
                && !AuthenticationService.isAuthenticated && !$window.localStorage.token) {

                $location.path("/user/login");
            }
        });
    })

;


