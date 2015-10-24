angular.module('app.recipes', ['ui.router'])

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



//---------------
// Controllers
//---------------



// Recipes

    .controller('RecipeDishTypeController', ['$scope', 'recipes', 'user', function ($scope, recipes, user) {
      $scope.user = user;
      $scope.recipes = recipes;
    }])


    .controller('RecipeListController', ['$scope', '$stateParams', 'recipes', 'tags', 'user', function ($scope, $stateParams, recipes, tags, user) {
      $scope.user = user;
      $scope.recipes = recipes;
      $scope.tags = tags;

      // parameters for search
      $scope.search = {};
      $scope.tagfilter = {};
      $scope.hideAdvSearch = true;

      // function for author search filtering
      $scope.disableAndClearAuthor = function() {
        if ($scope.search.author._id !== undefined) {
          $scope.search.author.fullname = undefined;
        }
      }

      // function for tag search filtering
      $scope.filterByTags = function(recipe) {
        var match = true;
        angular.forEach($scope.tagfilter, function(value, key) {
          if (value === true){
            var subMatch = false;
            for(i=0;i<recipe.tags.length;i++){
              if(key === recipe.tags[i].text){
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

    .controller('RecipeDetailCtrl', ['$rootScope', '$scope', '$stateParams', '$uibModal', 'UserService', 'Recipes', 'Tags', 'Ingredients', 'Units', 'DishTypes', '$state', 'TAIngredients', 'TATags', function ($rootScope, $scope, $stateParams, $uibModal, UserService, Recipes, Tags, Ingredients, Units, DishTypes, $state, TAIngredients, TATags) {
      $scope.allowEdit = false;
      $scope.alerts = [];
      $scope.submitted = false;

      if (!$stateParams.id) {
        $scope.recipe = new Recipes();
        $scope.recipe.ingredients = [];
        $scope.recipe.ingredients.push({qty: '', unit: '', ingredient: ''});
      } else {
        $scope.recipe = Recipes.get({id: $stateParams.id }, function(response) {
          $scope.recipe.ingredients.push({qty: '', unit: '', ingredient: ''});
          var user = UserService.getCurrentLoginUser();
          if (user._id == response.author._id || user.is_admin === true) {
            $scope.allowEdit = true;
          }
        });
      }

      $scope.units = Units.query();
      $scope.dishtypes = DishTypes.query();

      $scope.onTypeaheadSelect = function ($item, $model, $label) {
        if(!$scope.recipe.ingredients.filter(function(n){ return n.ingredient == '' }).length) {
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
          $state.go($rootScope.previousState.name, $rootScope.previousStateParams);
        });
      }

      $scope.cancel = function(){
        $scope.recipe = Recipes.get({id: $stateParams.id }, function(response) {
          $scope.recipe.ingredients.push({qty: '', unit: '', ingredient: ''});
          $scope.recipeedit = false;
          $scope.recipecopy = false;
        });
        
      }

      $scope.remove = function(){
        Recipes.remove({id: $scope.recipe._id}, function(){
          $state.go($rootScope.previousState.name, $rootScope.previousStateParams);
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
          $state.go($rootScope.previousState.name, $rootScope.previousStateParams);
        });
      }

      $scope.loadTags = function(viewValue) {
        return TATags.search({search: viewValue}).$promise.then(function(response) {
          return response;
        });
      }

      $scope.scheduleAdd = function() {
        var modalAddSchedule = $uibModal.open({
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


    .controller('ModalScheduleAddController', ['$scope', '$stateParams', '$modalInstance', '$filter', 'Schedules', 'recipe', function ($scope, $stateParams, $modalInstance, $filter, Schedules, recipe) {
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


//---------------
// Routes
//---------------

  .config(['$stateProvider', '$urlRouterProvider', function ($stateProvider, $urlRouterProvider) {

    $stateProvider
		.state('user.recipes', {
			abstract: true,
			url: "/recipes",
			template: "<ui-view />"
		})
      		.state('user.recipes.dishtypes', {
			url: '/dishtypes',
        		templateUrl: 'partials/recipes.dishtypes.tpl.html',
        		controller: 'RecipeDishTypeController',
			resolve: {
				recipes: function(Recipes){
					return Recipes.query();
				},
				user: function(UserService){
					return UserService.getCurrentLoginUser();
				}

			},
			data: {
	        		name: 'Recipes',
        			icon: 'glyphicon glyphicon-cutlery'
			}
      		})
      		.state('user.recipes.list', {
			url: '/list',
			params: {
				dishType: undefined,
				author: undefined,
				new_recipe: undefined
			},
        		templateUrl: 'partials/recipes.list.tpl.html',
        		controller: 'RecipeListController',
			resolve: {
				recipes: ['Recipes', '$stateParams', function(Recipes, $stateParams){
					var searchDate = new Date();
					searchDate = $stateParams.new_recipe ? searchDate.setDate(searchDate.getDate() - 14) : new Date(2015,0,0);
					var query = {'author': $stateParams.author, 'updated_at': searchDate, 'dishType': $stateParams.dishType};
					return Recipes.query(query);
				}],
				user: function(UserService){
					return UserService.getCurrentLoginUser();
				},
				tags: function(Tags){
					return Tags.query();
				}
			}
      		})
      		.state('user.recipes.view', {
			url: '/:id/view',
        		templateUrl: 'partials/recipes.view.tpl.html',
        		controller: 'RecipeDetailCtrl'
     		})
      		.state('user.recipes.edit', {
			url: '/:id/edit',
        		templateUrl: 'partials/recipes.edit.tpl.html',
        		controller: 'RecipeDetailCtrl'
     		})
      		.state('user.recipes.add', {
			url: '/add',
        		templateUrl: 'partials/recipes.add.tpl.html',
        		controller: 'RecipeDetailCtrl'
      		})
    ;
  }])
;


