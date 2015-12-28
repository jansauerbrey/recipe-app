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

        .factory('Favorites', ['$resource', 'BASE_URI', function($resource, BASE_URI){
          return $resource(BASE_URI+'api/user/favorites/:id', null, {
            'update': { method:'PUT' }
          });
        }])

        .factory('recipeActions', ['$rootScope', '$stateParams', '$uibModal', 'Recipes', '$state', 'Favorites', 'UserService', 'Tags', function ($rootScope, $stateParams, $uibModal, Recipes, $state, Favorites, UserService, Tags) {
          var data = {recipe: {},
          	recipeOrig: {},
          	factorAvailable: false,
          	factor: 0,
          	userExists: false,
          	allowEdit: false,
          	submitted: false,
          	validForm: false,
          	alerts: []};
          
          var setRecipe = function(recipeItem, factor){
          	data.recipe = recipeItem;
          	data.recipeOrig = angular.copy(data.recipe);
          	data.factorAvailable = factor > 0 ? true : false;
          	data.factor = data.factorAvailable ? factor : data.recipe.yield;
          	var user = UserService.getCurrentLoginUser();
						if (data.recipe.author && user && user._id == data.recipe.author._id || user && user.is_admin === true) {
							data.userExists = true;
							data.allowEdit = true;
						} else if (user){
							data.userExists = true;
						}
          }
          var create = function(){
			        if(!data.validForm){
								data.alerts.push({type: 'danger', msg: 'Please complete all required fields before saving.'})
								data.submitted = true;
								$rootScope.$broadcast("submittedValueChanged");
			          return;
			        }
			        if(!data.recipe || data.recipe.length < 1) return;
			        data.recipe.ingredients = data.recipe.ingredients.filter(function(n){ return n != ''});
			        for(i=0;i<data.recipe.tags.length;i++){
			          if (!data.recipe.tags[i]._id){
			            var tag = new Tags(data.recipe.tags[i]);
			            tag.$save();
			            data.recipe.tags[i] = tag._id;
			          }
			        }
			        for(i=0;i<data.recipe.ingredients.length;i++){
			          if (!(data.recipe.ingredients[i].ingredient && data.recipe.ingredients[i].ingredient._id)) {
			            data.recipe.ingredients.splice(i, 1);
			          }
			        }
			        
			        delete data.recipe._id;
			        data.recipe.$save(function(response){
			          $state.go('user.recipes.details.view', {id: response._id});
			        });
			      };
			      var update = function(){
							if(!data.validForm){
								data.alerts.push({type: 'danger', msg: 'Please complete all required fields before saving.'})
								data.submitted = true;
								$rootScope.$broadcast("submittedValueChanged");
								return;
							}
							for(i=0;i<data.recipe.tags.length;i++){
								if (!data.recipe.tags[i]._id){
									var tag = new Tags(data.recipe.tags[i]);
									tag.$save();
									data.recipe.tags[i] = tag._id;
								}
							}
							data.recipe.ingredients = data.recipe.ingredients.filter(function(n){ return n != ''});
							for(i=0;i<data.recipe.ingredients.length;i++){
								if (!(data.recipe.ingredients[i].ingredient && data.recipe.ingredients[i].ingredient._id)) {
									data.recipe.ingredients.splice(i, 1);
								}
							}

							Recipes.update({id: data.recipe._id}, data.recipe, function(response){
								setRecipe(response);
								$state.go($rootScope.previousState.name, $rootScope.previousStateParams);
							});
					  };
					  var remove = function(){
							Recipes.remove({id: data.recipe._id}, function(){
								if ($rootScope.previousState.name === 'user.recipes.details.edit' ) {
									$state.go('user.recipes.dishtypes');
								} else {
									$state.go($rootScope.previousState.name, $rootScope.previousStateParams);
								}
							});
						};
						var cancel = function(){
							data.recipe = angular.copy(data.recipeOrig);
							$state.go($rootScope.previousState.name, $rootScope.previousStateParams);
						};
						var setFavorite = function(){
							var parent = data;
							Favorites.update({id: data.recipe._id}, {method: 'add'}, function(response){
								UserService.updateFavoriteRecipes(response.favoriteRecipes);
								parent.recipe.fav_recipe = true;
							});
						};
						var unsetFavorite = function(){
							var parent = data;
							Favorites.update({id: data.recipe._id}, {method: 'delete'}, function(response){
								UserService.updateFavoriteRecipes(response.favoriteRecipes);
								parent.recipe.fav_recipe = false;
							});
						};
						        
          return {
          	data: data,
          	setRecipe: setRecipe,
          	setFavorite: setFavorite,
          	unsetFavorite: unsetFavorite,
            create: create,
            update: update,
            remove: remove,
            cancel: cancel
        }
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

    .controller('RecipeDetailCtrl', ['$rootScope', '$scope', '$stateParams', '$uibModal', 'Tags', 'units', 'dishtypes', 'TAIngredients', 'TATags', 'isCordova', 'recipeActions', function ($rootScope, $scope, $stateParams, $uibModal, Tags, units, dishtypes, TAIngredients, TATags, isCordova, recipeActions) {
			$scope.isCordova = isCordova;
			
			$scope.alerts = recipeActions.data.alerts;
			$scope.submitted = recipeActions.data.submitted;
			$scope.recipe = recipeActions.data.recipe;
			$scope.factorAvailable = recipeActions.data.factorAvailable;
			$scope.factor = recipeActions.data.factor;
			$scope.allowEdit = recipeActions.data.allowEdit;
			$scope.userExists = recipeActions.data.userExists;
      
			$scope.favorite = function() {
		    recipeActions.setFavorite();
		  }
		  $scope.unfavorite = function() {
		    recipeActions.unsetFavorite();
		  }
			$scope.save = function() {
		    recipeActions.create();
		  }
			$scope.update = function() {
		    recipeActions.update();
		  }
			$scope.remove = function() {
		    recipeActions.remove();
		  }
			$scope.cancel = function() {
		    recipeActions.cancel();
		  };
      $scope.closeAlert = function(index){
        $scope.alerts.splice(index, 1);
      }
      
      $scope.$on("submittedValueChanged", function(){
				$scope.submitted = recipeActions.data.submitted;
      });


      $scope.scheduleAdd = function() {
        var modalAddSchedule = $uibModal.open({
          animation: true,
          templateUrl: 'partials/recipes.scheduleadd.tpl.html',
          controller: 'ModalScheduleAddControllerRecipes',
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
      
      $scope.share = function() {
        var modalShare = $uibModal.open({
          animation: true,
          templateUrl: 'partials/recipes.share.tpl.html',
          controller: 'ModalShareControllerRecipes',
          size: 'xs',
          resolve: {
            recipe: function(){
              return $scope.recipe;
            }
          }
        });


        modalShare.result.then(function(successMsg){
          $scope.alerts.push(successMsg);
        });

      }
      
			$scope.units = units;
			$scope.dishtypes = dishtypes;

			$scope.onTypeaheadSelect = function ($item, $model, $label) {
				if(!$scope.recipe.ingredients.filter(function(n){ return n.ingredient == '' }).length) {
					$scope.recipe.ingredients.push({qty: '', unit: '', ingredient: ''});
				}
			};
			
			$scope.GetIngredients = function(viewValue){
				return TAIngredients.search({search: viewValue, language: $scope.recipe.language}).$promise.then(function(response) {
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

      $scope.loadTags = function(viewValue) {
        return TATags.search({search: viewValue}).$promise.then(function(response) {
          return response;
        });
      }
      
     	$scope.$watch('recipeForm.$valid', function(newVal) {
          recipeActions.data.validForm = newVal;
      });

    }])


    .controller('ModalScheduleAddControllerRecipes', ['$scope', '$modalInstance', '$filter', 'Schedules', 'recipe', function ($scope, $modalInstance, $filter, Schedules, recipe) {
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

    }])
    
    .controller('ModalShareControllerRecipes', ['$scope', '$modalInstance', '$filter', 'recipe', function ($scope, $modalInstance, $filter, recipe) {
      $scope.recipe = recipe;
      
      var hashtagArray = [];
      for(i=0;i<recipe.tags.length;i++){
      	hashtagArray.push(recipe.tags[i].text);
      }
      $scope.hashtags = hashtagArray.join(", ")
     
      $scope.cancel = function(){
        $modalInstance.dismiss('cancel');
      }

    }])
    
    
    .controller('RecipeDetailActionsCtrl', ['$rootScope', '$scope', '$uibModal', 'recipeActions', function ($rootScope, $scope, $uibModal, recipeActions) {
    		
			$scope.alerts = recipeActions.data.alerts;
			$scope.submitted = recipeActions.data.submitted;
			$scope.recipe = recipeActions.data.recipe;
			$scope.allowEdit = recipeActions.data.allowEdit;
			$scope.userExists = recipeActions.data.userExists;
			
      
			$scope.favorite = function() {
		    recipeActions.setFavorite();
		  }
		  $scope.unfavorite = function() {
		    recipeActions.unsetFavorite();
		  }
			$scope.save = function() {
		    recipeActions.create();
		  }
			$scope.update = function() {
		    recipeActions.update();
		  }
			$scope.remove = function() {
		    recipeActions.remove();
		  }
			$scope.cancel = function() {
		    recipeActions.cancel();
		  };
      $scope.closeAlert = function(index){
        $scope.alerts.splice(index, 1);
      }


      $scope.scheduleAdd = function() {
        var modalAddSchedule = $uibModal.open({
          animation: true,
          templateUrl: 'partials/recipes.scheduleadd.tpl.html',
          controller: 'ModalScheduleAddControllerRecipes',
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

      $scope.share = function() {
        var modalShare = $uibModal.open({
          animation: true,
          templateUrl: 'partials/recipes.share.tpl.html',
          controller: 'ModalShareControllerRecipes',
          size: 'xs',
          resolve: {
            recipe: function(){
              return $scope.recipe;
            }
          }
        });


        modalShare.result.then(function(successMsg){
          $scope.alerts.push(successMsg);
        });

      }
    }])
    
    
    .controller('RecipeDetailActionSidebarCtrl', ['$rootScope', '$scope', '$uibModal', 'recipeActions', '$modalInstance', function ($rootScope, $scope, $uibModal, recipeActions, $modalInstance) {
			
			$scope.alerts = recipeActions.data.alerts;
			$scope.submitted = recipeActions.data.submitted;
			$scope.recipe = recipeActions.data.recipe;
			$scope.allowEdit = recipeActions.data.allowEdit;
			$scope.userExists = recipeActions.data.userExists;
			
      
			$scope.favorite = function() {
		    recipeActions.setFavorite();
		  }
		  $scope.unfavorite = function() {
		    recipeActions.unsetFavorite();
		  }
			$scope.save = function() {
				recipeActions.data.submitted = true;
		    recipeActions.create();
		  }
			$scope.update = function() {
				recipeActions.data.submitted = true;
		    recipeActions.update();
		  }
			$scope.remove = function() {
		    recipeActions.remove();
		  }
			$scope.cancel = function() {
		    recipeActions.cancel();
		  };
      $scope.closeAlert = function(index){
        $scope.alerts.splice(index, 1);
      }


      $scope.scheduleAdd = function() {
        var modalAddSchedule = $uibModal.open({
          animation: true,
          templateUrl: 'partials/recipes.scheduleadd.tpl.html',
          controller: 'ModalScheduleAddControllerRecipes',
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
      
      
      $scope.share = function() {
        var modalShare = $uibModal.open({
          animation: true,
          templateUrl: 'partials/recipes.share.tpl.html',
          controller: 'ModalShareControllerRecipes',
          size: 'xs',
          resolve: {
            recipe: function(){
              return $scope.recipe;
            }
          }
        });


        modalShare.result.then(function(successMsg){
          $scope.alerts.push(successMsg);
        });

      }
      
      
      $scope.closeSidebar = function(){
        $modalInstance.dismiss('cancel');
      }

    }])
    
    
// Actionbar

    .controller('ActionSidebarRecipeController', ['$scope', '$aside', function ($scope, $aside) {
     
     
      $scope.recipeDetailsView = function() {
            var asideInstance = $aside.open({
              template: '<div ng-click="closeSidebar()" ng-include="\'partials/recipes.view.links.tpl.html\'"></div>',
              controller: 'RecipeDetailActionSidebarCtrl',
              placement: 'right',
              size: 'sm'
            });
          }
          
      $scope.recipeDetailsEdit = function() {
            var asideInstance = $aside.open({
              template: '<div ng-click="closeSidebar()" ng-include="\'partials/recipes.edit.links.tpl.html\'"></div>',
              controller: 'RecipeDetailActionSidebarCtrl',
              placement: 'right',
              size: 'sm'
            });
          }
          
      $scope.recipeDetailsAdd = function() {
            var asideInstance = $aside.open({
              template: '<div ng-click="closeSidebar()" ng-include="\'partials/recipes.add.links.tpl.html\'"></div>',
              controller: 'RecipeDetailActionSidebarCtrl',
              placement: 'right',
              size: 'sm'
            });
          }

    }])


//---------------
// Routes
//---------------

  .config(['$stateProvider', '$urlRouterProvider', function ($stateProvider, $urlRouterProvider) {

    $stateProvider
		.state('user.recipes', {
			abstract: true,
			url: "/recipes",
			template: '<ui-view />',
			data: {
	      title: 'Recipes'
			}
		})
    .state('user.recipes.dishtypes', {
			url: '/dishtypes',
			views: {
    		'': {
	    		templateUrl: 'partials/recipes.dishtypes.tpl.html',
					controller: 'RecipeDishTypeController'
				},
				'actionnavigation-xs@': {
	    		template: '<button type="button" class="navbar-toggle actionbutton" ui-sref="user.recipes.details.add"><i class="glyphicon glyphicon-plus"></i></button>',
					controller: 'ActionSidebarRecipeController'
				}
			},
			resolve: {
				recipes: function(Recipes){
					return Recipes.query().$promise;
				},
				user: function(UserService){
					return UserService.getCurrentLoginUser();
				}

			}
    })
    .state('user.recipes.list', {
			url: '/list',
			params: {
				dishType: undefined,
				author: undefined,
				new_recipe: undefined,
				fav_recipe: undefined
			},
			views: {
    		'': {
	    		templateUrl: 'partials/recipes.list.tpl.html',
					controller: 'RecipeListController'
				},
				'actionnavigation-xs@': {
	    		template: '<button type="button" class="navbar-toggle actionbutton" ui-sref="user.recipes.details.add"><i class="glyphicon glyphicon-plus"></i></button>',
					controller: 'ActionSidebarRecipeController'
				}
			},
			resolve: {
				recipes: ['Recipes', '$stateParams', function(Recipes, $stateParams){
					var searchDate = new Date();
					searchDate = $stateParams.new_recipe ? searchDate.setDate(searchDate.getDate() - 14) : new Date(2015,0,0);
					var query = {'author': $stateParams.author, 'updated_at': searchDate, 'dishType': $stateParams.dishType, '_id': $stateParams.fav_recipe};
					return Recipes.query(query).$promise;
				}],
				user: function(UserService){
					return UserService.getCurrentLoginUser();
				},
				tags: function(Tags){
					return Tags.query().$promise;
				}
			}
      		})
			.state('user.recipes.details', {
				abstract: true,
				url: "/details/:id",
				params: {factor: null},
				templateUrl: 'partials/recipes.details.layout.tpl.html',
				resolve: {
					recipe: ['Recipes', '$stateParams', 'recipeActions', function(Recipes, $stateParams, recipeActions){
						if ($stateParams.id) {
							var recipe = Recipes.get({'id': $stateParams.id}, function(response) {
								response.ingredients.push({qty: '', unit: '', ingredient: ''});
								recipeActions.setRecipe(response, $stateParams.factor);
							}).$promise;
							return recipe;
						} else {
							var recipe = new Recipes();
							recipe.ingredients = [];
							recipe.ingredients.push({qty: '', unit: '', ingredient: ''});
							recipe.imagePath = "no_image.png";
							recipeActions.data.recipe = recipe;
							return recipe;
						}
					}],
					units: function(Units){
						return Units.query().$promise;
					},
					dishtypes: function(DishTypes){
						return DishTypes.query().$promise;
					}
				}
			})
  		.state('user.recipes.details.view', {
				url: '/view',
				params: {factor: null},
				views: {
	    		'main': {
		    		templateUrl: 'partials/recipes.view.tpl.html',
						controller: 'RecipeDetailCtrl'
					},
					'sidelinks': {
		    		templateUrl: 'partials/recipes.view.links.tpl.html',
						controller: 'RecipeDetailActionsCtrl'
					},
					'actionnavigation-xs@': {
		    		template: '<button type="button" class="navbar-toggle actionbutton" ng-click="recipeDetailsView()"><i class="glyphicon glyphicon-option-horizontal"></i></button>',
						controller: 'ActionSidebarRecipeController'
					},
					'actionnavigation-sm@': {
		    		template: '<a ng-click="recipeDetailsView()" class="navbar-sm-more"><span class="glyphicon glyphicon-plus" style="padding-right: 10px;"></span>More</a>',
						controller: 'ActionSidebarRecipeController' 
					}
				}
				
 			})
  		.state('user.recipes.details.edit', {
				url: '/edit',
				views: {
	    		'main': {
		    		templateUrl: 'partials/recipes.edit.form.tpl.html',
						controller: 'RecipeDetailCtrl'
					},
					'sidelinks': {
		    		templateUrl: 'partials/recipes.edit.links.tpl.html',
						controller: 'RecipeDetailActionsCtrl'
					},
					'actionnavigation-xs@': {
		    		template: '<button type="button" class="navbar-toggle actionbutton" ng-click="recipeDetailsEdit()"><i class="glyphicon glyphicon-floppy-disk"></i></button>',
						controller: 'ActionSidebarRecipeController'
					},
					'actionnavigation-sm@': {
		    		template: '<a ng-click="recipeDetailsEdit()" class="navbar-sm-more"><span class="glyphicon glyphicon-floppy-disk" style="padding-right: 10px;"></span>Save</a>',
						controller: 'ActionSidebarRecipeController' 
					}
				}
 			})
  		.state('user.recipes.details.add', {
				url: '^/recipe/add',
				views: {
	    		'main': {
		    		templateUrl: 'partials/recipes.edit.form.tpl.html',
						controller: 'RecipeDetailCtrl'
					},
					'sidelinks': {
		    		templateUrl: 'partials/recipes.add.links.tpl.html',
						controller: 'RecipeDetailActionsCtrl'
					},
					'actionnavigation-xs@': {
		    		template: '<button type="button" class="navbar-toggle actionbutton" ng-click="recipeDetailsAdd()"><i class="glyphicon glyphicon-floppy-disk"></i></button>',
						controller: 'ActionSidebarRecipeController'
					},
					'actionnavigation-sm@': {
		    		template: '<a ng-click="recipeDetailsAdd()" class="navbar-sm-more"><span class="glyphicon glyphicon-floppy-disk" style="padding-right: 10px;"></span>Save</a>',
						controller: 'ActionSidebarRecipeController' 
					}
				}
  		})
  		
  		
			.state('anon.recipes', {
				abstract: true,
				url: "/sharedrecipe",
				template: '<ui-view />',
				data: {
		      title: 'Recipes'
				}
			})
			.state('anon.recipes.details', {
				abstract: true,
				url: "/:id",
				params: {factor: null},
				templateUrl: 'partials/recipes.details.layout.tpl.html',
				resolve: {
					recipe: ['Recipes', '$stateParams', 'recipeActions', function(Recipes, $stateParams, recipeActions){
						if ($stateParams.id) {
								var recipe = Recipes.get({'id': $stateParams.id}, function(response) {
									response.ingredients.push({qty: '', unit: '', ingredient: ''});
									recipeActions.setRecipe(response, $stateParams.factor);
								}).$promise;
							return recipe;
						} else {
							var recipe = new Recipes();
							recipe.ingredients = [];
							recipe.ingredients.push({qty: '', unit: '', ingredient: ''});
							recipe.imagePath = "no_image.png";
							recipeActions.data.recipe = recipe;
							return recipe;
						}
					}],
					units: function(){
						return {};
					},
					dishtypes: function(){
						return {};
					}
				}
			})
  		.state('anon.recipes.details.view', {
				url: '',
				params: {factor: null},
				views: {
	    		'main': {
		    		templateUrl: 'partials/recipes.view.tpl.html',
						controller: 'RecipeDetailCtrl'
					},
					'sidelinks': {
		    		templateUrl: 'partials/recipes.view.links.tpl.html',
						controller: 'RecipeDetailActionsCtrl'
					},
					'actionnavigation-xs@': {
		    		template: '<button type="button" class="navbar-toggle actionbutton" ng-click="recipeDetailsView()"><i class="glyphicon glyphicon-option-horizontal"></i></button>',
						controller: 'ActionSidebarRecipeController'
					},
					'actionnavigation-sm@': {
		    		template: '<a ng-click="recipeDetailsView()" class="navbar-sm-more"><span class="glyphicon glyphicon-plus" style="padding-right: 10px;"></span>More</a>',
						controller: 'ActionSidebarRecipeController' 
					}
				}
				
 			})
    ;
  }])
;


