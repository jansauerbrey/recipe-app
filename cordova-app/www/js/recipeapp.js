angular.module('app', ['ngRoute', 'ngResource', 'ngStorage', 'ui.bootstrap', 'ui.checkbox', 'ngTagsInput', 'ngAside'])

//---------------
// Constants
//---------------


    .constant('BASE_URI', '/')


//---------------
// Services
//---------------


// Auth

    .factory('UserService', [ '$localStorage', function($localStorage){
        var currentUser,
            createUser = function(data){
                currentUser = data;
                $localStorage.user = data;
            },
            getCurrentLoginUser = function(){
                return currentUser;
            },
            deleteCurrentUser = function(){
                currentUser = undefined;
                delete $localStorage.user;
            },
            isAuthenticated = function() {
                return (currentUser !== undefined);
            },
            getToken = function() {
                if (currentUser !== undefined){
                    return currentUser.token;
                }
            };

            if ($localStorage.user){
                createUser($localStorage.user);
            }

        return {
            createUser: createUser,
            getCurrentLoginUser: getCurrentLoginUser,
            deleteCurrentUser: deleteCurrentUser,
            isAuthenticated: isAuthenticated,
            getToken: getToken
        }

    }])


    .factory('AuthenticationService', [ '$http', '$localStorage', 'UserService', 'BASE_URI', function($http, $localStorage, UserService, BASE_URI) {
        var logIn = function(username, password, autologin) {
                return $http.post(BASE_URI+'api/user/login', {username: username, password: password, autologin: autologin}).success(function(data) {
                    data.permissions = ["User"];
                    if (data.is_admin) {
                        data.permissions.push("Admin");
                    }
                    UserService.createUser(data);
                    return true;
                });
            },
            logOut = function() {
                $http.get(BASE_URI+'api/user/logout').success(function(){
                     UserService.deleteCurrentUser();
                     return true;
                });
            },
            register = function(user) {
                return $http.post(BASE_URI+'/api/user/register', user);
            };

        return {
            logIn: logIn,
            logOut: logOut,
            register: register
        }
    }])

    .factory('AuthorisationService', ['UserService', function(UserService) {
	var authorize = function (requiresLogin, requiredPermissions, permissionType, requiresLogout) {
	    var result = 0,
		user = UserService.getCurrentLoginUser(),
		loweredPermissions = [],
		hasPermission = true,
		permission, i;

	    permissionType = permissionType || 0;
	    if (requiresLogin === true && user === undefined) {
		result = 1;
	    } else if ((requiresLogin === true && user !== undefined) &&
		(requiredPermissions === undefined || requiredPermissions.length === 0)) {
		// Login is required but no specific permissions are specified.
		result = 0;
	    } else if (requiredPermissions) {
                // fill NoUser info to user in case there is no user
                if (user === undefined){
                  user = {permissions: ['NoUser']};
                }
		loweredPermissions = [];
		angular.forEach(user.permissions, function (permission) {
		    loweredPermissions.push(permission.toLowerCase());
		});

		for (i = 0; i < requiredPermissions.length; i += 1) {
		    permission = requiredPermissions[i].toLowerCase();

		    if (permissionType === 1) {
		        hasPermission = hasPermission && loweredPermissions.indexOf(permission) > -1;
		        // if all the permissions are required and hasPermission is false there is no point carrying on
		        if (hasPermission === false) {
		            break;
		        }
		    } else if (permissionType === 0) {
		        hasPermission = loweredPermissions.indexOf(permission) > -1;
		        // if we only need one of the permissions and we have it there is no point carrying on
		        if (hasPermission) {
		            break;
		        }
		    }
		}

		result = hasPermission ? 0 : 2;
	    }

	    return result;
	};

	return {
	  authorize: authorize
	};
    }])


    .factory('TokenInterceptor', ['$q', 'UserService', '$location', function ($q, UserService, $location) {
        return {
            request: function (config) {
                config.headers = config.headers || {};
                if (UserService.isAuthenticated() === true) {
                    config.headers.Authorization = 'AUTH ' + UserService.getToken();
                }
                return config;
            },

            requestError: function(rejection) {
                return $q.reject(rejection);
            },

            /* Set Authentication.isAuthenticated to true if 200 received */
            response: function (response) {
                if (response != null && response.status == 200) {

                }
                return response || $q.when(response);
            },

            /* Revoke client authentication if 401 is received */
            responseError: function(rejection) {
                if (rejection != null && rejection.status === 401) {
                    UserService.deleteCurrentUser();
                    $location.path("/user/login/").replace();
                }

                return $q.reject(rejection);
            }
        };
    }])

// Navigation

    .factory('routeNavigation', function($route, $location) {
        var routes = [];
        angular.forEach($route.routes, function (route, path) {
            if (route.name) {
                routes.push({
                    path: path,
                    name: route.name,
                    icon: route.icon,
                    panelright: route.access.panelright ? route.access.panelright : false,
                    requiresLogin: route.access.requiresLogin,
                    requiredPermissions: route.access.requiredPermissions ? route.access.requiredPermissions.join() : undefined
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

        .factory('User', ['$resource', 'BASE_URI', function($resource, BASE_URI){
          return $resource(BASE_URI+'api/user/info/:id');
        }])

        .factory('Units', ['$resource', 'BASE_URI', function($resource, BASE_URI){
          return $resource(BASE_URI+'api/units/:id', null, {
            'update': { method:'PUT' }
          });
        }])

        .factory('Ingredients', ['$resource', 'BASE_URI', function($resource, BASE_URI){
          return $resource(BASE_URI+'api/ingredients/:id', null, {
            'update': { method:'PUT' }
          });
        }])

        .factory('Categories', ['$resource', 'BASE_URI', function($resource, BASE_URI){
          return $resource(BASE_URI+'api/categories/:id', null, {
            'update': { method:'PUT' }
          });
        }])

        .factory('TAIngredients', ['$resource', 'BASE_URI', function($resource, BASE_URI){
          return $resource(BASE_URI+'api/typeahead/ingredients/', null, {
            'search': { method:'GET', isArray: true }
          });
        }])

        .factory('Tags', ['$resource', 'BASE_URI', function($resource, BASE_URI){
          return $resource(BASE_URI+'api/tags/:id', null, {
            'update': { method:'PUT' }
          });
        }])

        .factory('TATags', ['$resource', 'BASE_URI', function($resource, BASE_URI){
          return $resource(BASE_URI+'api/typeahead/tags/', null, {
            'search': { method:'GET', isArray: true }
          });
        }])

        .factory('Recipes', ['$resource', 'BASE_URI', function($resource, BASE_URI){
          return $resource(BASE_URI+'api/recipes/:id', null, {
            'update': { method:'PUT' }
          });
        }])

        .factory('TARecipes', ['$resource', 'BASE_URI', function($resource, BASE_URI){
          return $resource(BASE_URI+'api/typeahead/recipes/', null, {
            'search': { method:'GET', isArray: true }
          });
        }])

        .factory('Schedules', ['$resource', 'BASE_URI', function($resource, BASE_URI){
          return $resource(BASE_URI+'api/schedules/:id', null, {
            'update': { method:'PUT' }
          });
        }])


        .factory('Shopitems', ['$resource', 'BASE_URI', function($resource, BASE_URI){
          return $resource(BASE_URI+'api/shopitems/:id', null, {
            'update': { method:'PUT' }
          });
        }])

        .factory('Users', ['$resource', 'BASE_URI', function($resource, BASE_URI){
          return $resource(BASE_URI+'api/admin/user/:id', null, {
            'update': { method:'PUT' }
          });
        }])

//---------------
// Controllers
//---------------


// Auth

    .controller('UserCtrl', ['$scope', '$location', 'Users', 'AuthenticationService',
        function UserCtrl($scope, $location, Users, AuthenticationService) {
 
        $scope.logIn = function logIn(username, password, autologin) {
            if (username !== undefined && password !== undefined) { 
                AuthenticationService.logIn(username, password, autologin).then(function(){
	          $location.path("/home/");
                });
            }
        }
 
        $scope.user = new Users();

        $scope.register = function register() {
	    AuthenticationService.register($scope.user).success(function(data) {
	        $location.path("/");
	    });
	}
    }])



    .controller('UserLogout', ['$scope', '$location', '$localStorage', 'AuthenticationService',
        function UserLogout($scope, $location, $localStorage, AuthenticationService) {
        AuthenticationService.logOut();
    }])


// Start Page


    .controller('StartpageController', ['$scope', function ($scope) {
    }])


// Home Page


    .controller('HomeController', ['$scope', function ($scope) {
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

    .controller('RecipesController', ['$scope', 'Recipes', 'Tags', 'UserService', function ($scope, Recipes, Tags, UserService) {
      $scope.search = {};
      $scope.editing = [];
      $scope.tagfilter = {};
      $scope.loading = true;
      $scope.hideAdvSearch = true;
      $scope.status = {};
      $scope.status.tags = true;

      $scope.user = UserService.getCurrentLoginUser();

      $scope.tags = Tags.query();

      $scope.recipes = Recipes.query(function(response) {
        $scope.loading = false;
        for(i=0;i<response.length;i++){
          var delta = Math.abs(new Date() - new Date(response[i].updated_at));
          response[i].new_recipe = (delta < 864000000) ? true : false;
        }
        return response;
      });

      $scope.disableAndClearAuthor = function() {
        if ($scope.search.author._id !== undefined) {
          $scope.search.author.fullname = undefined;
        }
      }

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

    .controller('RecipeDetailCtrl', ['$scope', '$routeParams', '$modal', 'UserService', 'Recipes', 'Tags', 'Ingredients', 'Units', '$location', 'TAIngredients', 'TATags', function ($scope, $routeParams, $modal, UserService, Recipes, Tags, Ingredients, Units, $location, TAIngredients, TATags) {
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
          var user = UserService.getCurrentLoginUser();
          if (user._id == response.author._id || user.is_admin === true) {
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
          $scope.recipe.ingredients.push({qty: '', unit: '', ingredient: ''});
          $scope.recipeedit = false;
          $scope.recipecopy = false;
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
        $scope.recipe._id = null;
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

    .controller('ShopitemsController', ['$scope', '$routeParams', '$modal', 'UserService', 'Shopitems', 'TAIngredients', 'Units', '$location', '$filter', function ($scope, $routeParams, $modal, UserService, Shopitems, TAIngredients, Units, $location, $filter) {

      $scope.user = UserService.getCurrentLoginUser();
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
          var order = $scope.user.settings.categoryOrder.indexOf(response[i].ingredient.category) >= 0 ? $scope.user.settings.categoryOrder.indexOf(response[i].ingredient.category) : 99999;
          var index = containsObj(uniqueIngredientsTemp, {ingredient:response[i].ingredient, unit:response[i].unit, order: order, completed: response[i].completed});
          if ( index === false) {
            uniqueIngredientsTemp.push({ingredient:response[i].ingredient, unit:response[i].unit, order: order, completed: response[i].completed});
            var obj = {ingredient:response[i].ingredient, unit:response[i].unit, order: order, completed: response[i].completed};
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


// Sidebar

    .controller('NavSidebarController', ['$scope', '$modalInstance', function ($scope, $modalInstance) {
     
      $scope.cancel = function(){
        $modalInstance.dismiss('cancel');
      }

    }])


//---------------
// Directives
//---------------

    .directive('navigation', ['$aside', 'routeNavigation', 'UserService', 'AuthorisationService', function ($aside, routeNavigation, UserService, AuthorisationService) {
      return {
        restrict: "E",
        replace: true,
        templateUrl: "partials/navigation-directive.tpl.html",
        controller:  function ($scope) {
          $scope.hideMobileNav = true;
          $scope.user = UserService.getCurrentLoginUser();
          $scope.routes = routeNavigation.routes;
          $scope.activeRoute = routeNavigation.activeRoute;

          $scope.$watch(UserService.isAuthenticated, function () {
              $scope.user = UserService.getCurrentLoginUser();
          }, true)

          $scope.determineVisibility = function(roles){
            if (roles === undefined) return true;
            roleArray = roles.split(',');
            var auhtorisation = AuthorisationService.authorize(undefined, roleArray);
            return (auhtorisation === 0);
          };
          $scope.navSidebar = function() {
            var asideInstance = $aside.open({
              templateUrl: 'partials/navigation.sidebar.tpl.html',
              controller: 'NavSidebarController',
              placement: 'left',
              size: 'lg'
            });
          }

        }
      };
    }])

    .directive('access', [  
        'AuthorisationService',
        function (AuthorisationService) {
            return {
              restrict: 'A',
              link: function (scope, element, attrs) {
                  var makeVisible = function () {
                          element.removeClass('hidden');
                      },
                      makeHidden = function () {
                          element.addClass('hidden');
                      },
                      determineVisibility = function (resetFirst) {
                          var result;
                          if (resetFirst) {
                              makeVisible();
                          }

                          result = AuthorisationService.authorize(undefined, roles);
                          if (result === 0) {
                              makeVisible();
                          } else {
                              makeHidden();
                          }
                      },
                      roles = attrs.access.split(',');


                  if (roles.length > 0) {
                      determineVisibility(true);
                  }
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

//---------------
// Routes
//---------------

  .config(['$routeProvider', function ($routeProvider) {
    $routeProvider
      .when('/', {
        templateUrl: 'partials/startpage.tpl.html',
        controller: 'StartpageController',
        access: { requiresLogin: false }
      })

      .when('/home/', {
        templateUrl: 'partials/home.tpl.html',
        controller: 'HomeController',
        access: { requiresLogin: true, 
                  requiredPermissions: ['User'] }
      })

      .when('/units/', {
        templateUrl: 'partials/units.tpl.html',
        controller: 'UnitsController',
        name: 'Units',
        icon: 'glyphicon glyphicon-scale',
        access: { requiresLogin: true,
                  requiredPermissions: ['Admin']}
      })
    
      .when('/units/edit/:id', {
        templateUrl: 'partials/units.details.tpl.html',
        controller: 'UnitDetailCtrl',
        access: { requiresLogin: true,
                  requiredPermissions: ['Admin']}
     })

      .when('/units/add/', {
        templateUrl: 'partials/units.add.tpl.html',
        controller: 'UnitDetailCtrl',
        access: { requiresLogin: true,
                  requiredPermissions: ['Admin']}
      })


      .when('/ingredients/', {
        templateUrl: 'partials/ingredients.tpl.html',
        controller: 'IngredientsController',
        name: 'Ingredients',
        icon: 'glyphicon glyphicon-apple',
        access: { requiresLogin: true,
                  requiredPermissions: ['Admin']}
      })
    
      .when('/ingredients/edit/:id', {
        templateUrl: 'partials/ingredients.details.tpl.html',
        controller: 'IngredientDetailCtrl',
        access: { requiresLogin: true,
                  requiredPermissions: ['Admin']}
     })

      .when('/ingredients/add/', {
        templateUrl: 'partials/ingredients.add.tpl.html',
        controller: 'IngredientDetailCtrl',
        access: { requiresLogin: true,
                  requiredPermissions: ['Admin']}
      })


      .when('/recipes/', {
        templateUrl: 'partials/recipes.tpl.html',
        controller: 'RecipesController',
        name: 'Recipes',
        icon: 'glyphicon glyphicon-cutlery',
        access: { requiresLogin: true, 
                  requiredPermissions: ['User']}
      })
    
      .when('/recipes/edit/:id', {
        templateUrl: 'partials/recipes.edit.tpl.html',
        controller: 'RecipeDetailCtrl',
        access: { requiresLogin: true,
                  requiredPermissions: ['User']}
     })

      .when('/recipes/add/', {
        templateUrl: 'partials/recipes.add.tpl.html',
        controller: 'RecipeDetailCtrl',
        access: { requiresLogin: true, 
                  requiredPermissions: ['User']}
      })

      .when('/schedules/', {
        templateUrl: 'partials/schedules.tpl.html',
        controller: 'SchedulesController',
        name: 'Schedules',
        icon: 'glyphicon glyphicon-calendar',
        access: { requiresLogin: true, 
                  requiredPermissions: ['User']}
      })

      .when('/schedules/:date', {
        templateUrl: 'partials/schedules.date.tpl.html',
        controller: 'SchedulesController',
        access: { requiresLogin: true, 
                  requiredPermissions: ['User']}
      })

      .when('/shopitems/', {
        templateUrl: 'partials/shopitems.tpl.html',
        controller: 'ShopitemsController',
        name: 'Shopping List',
        icon: 'glyphicon glyphicon-shopping-cart',
        access: { requiresLogin: true, 
                  requiredPermissions: ['User']}
      })

      .when('/cooking/', {
        templateUrl: 'partials/cooking.date.tpl.html',
        controller: 'CookingController',
        name: 'Cooking',
        icon: 'glyphicon glyphicon-fire',
        access: { requiresLogin: true, 
                  requiredPermissions: ['User']}
      })

      .when('/cooking/:date', {
        templateUrl: 'partials/cooking.date.tpl.html',
        controller: 'CookingController',
        access: { requiresLogin: true, 
                  requiredPermissions: ['User']}
      })
    
      .when('/admin/user/', {
        templateUrl: 'partials/admin.user.tpl.html',
        controller: 'AdminUserCtrl',
        name: 'Users',
        icon: 'glyphicon glyphicon-user',
        access: { requiresLogin: true,
                  requiredPermissions: ['Admin']}
      })

      .when('/impressum/', {
        templateUrl: 'partials/impressum.tpl.html',
        controller: 'ImpressumController',
        name: 'Impressum',
        icon: 'glyphicon glyphicon-info-sign',
        access: { requiresLogin: false }
      })

      .when('/user/register/', {
        templateUrl: 'partials/user.register.tpl.html',
        controller: 'UserCtrl',
        name: 'Register',
        icon: 'glyphicon glyphicon-edit',
        access: { panelright: true,
                  requiredPermissions: ['NoUser'] }
      })

      .when('/user/login/', {
        templateUrl: 'partials/user.login.tpl.html',
        controller: 'UserCtrl',
        name: 'Login',
        icon: 'glyphicon glyphicon-log-in',
        access: { panelright: true,
                  requiredPermissions: ['NoUser'] }
      })

      .when('/user/logout/', {
        templateUrl: 'partials/user.logout.tpl.html',
        controller: 'UserLogout',
        name: 'Logout',
        icon: 'glyphicon glyphicon-log-out',
        access: { panelright: true,
                  requiresLogin: true, 
                  requiredPermissions: ['User']}
      })

      .when('/access/denied/', {
        templateUrl: 'partials/access.denied.tpl.html',
        access: { requiresLogin: false }
      })

    ;
  }])

    .run(['$rootScope', '$location', '$localStorage', '$http', 'AuthorisationService', 'UserService', 'BASE_URI', function($rootScope, $location, $localStorage, $http, AuthorisationService, UserService, BASE_URI) {
	var routeChangeRequiredAfterLogin = false,
	    loginRedirectUrl;
        $rootScope.$on("$routeChangeStart", function(event, nextRoute, currentRoute) {
            var authorised;
            if (UserService.getCurrentLoginUser() !== undefined) $http.get(BASE_URI+'api/user/check');
            if (routeChangeRequiredAfterLogin && nextRoute.originalPath !== "/user/login/") {
                routeChangeRequiredAfterLogin = false;
                $location.path(loginRedirectUrl).replace();
            } else if (nextRoute.access !== undefined) {
                authorised = AuthorisationService.authorize(nextRoute.access.requiresLogin,
                                                     nextRoute.access.requiredPermissions,
                                                     nextRoute.access.permissionType,
                                                     nextRoute.access.requiresLogout);
                if (authorised === 1) {
                    routeChangeRequiredAfterLogin = true;
                    loginRedirectUrl = (nextRoute.originalPath !== "/user/login/") ? nextRoute.originalPath : "/" ;
                    $location.path("/user/login/");
                } else if (authorised === 2) {
                    $location.path("/access/denied/").replace();
                }
            }
        });
    }])

;


