angular.module('app.recipes', ['ui.router', 'modalstate', 'app.alert'])

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

        .factory('RecipeService', ['$rootScope', '$stateParams', '$uibModal', 'AlertService', 'Recipes', '$state', 'Favorites', 'UserService', 'Tags', function ($rootScope, $stateParams, $uibModal, AlertService, Recipes, $state, Favorites, UserService, Tags) {
          var data = {recipe: {},
          	recipeOrig: {},
          	factorAvailable: false,
          	factor: 0,
          	userExists: false,
          	allowEdit: false,
          	submitted: false,
          	validForm: false};
          
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
								AlertService.add('danger', 'Please complete all required fields before saving.');
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
								AlertService.add('danger', 'Please complete all required fields before saving.')
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

    .controller('RecipeDishTypeController', ['$scope', 'UserService', 'recipeCount', function ($scope, UserService, recipeCount) {
      $scope.user = UserService.getCurrentLoginUser();
      $scope.recipeCount = recipeCount.data;
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

    .controller('RecipeDetailCtrl', ['$rootScope', '$scope', '$stateParams', '$uibModal', 'Tags', 'units', 'dishtypes', 'TAIngredients', 'TATags', 'isCordova', 'RecipeService', function ($rootScope, $scope, $stateParams, $uibModal, Tags, units, dishtypes, TAIngredients, TATags, isCordova, RecipeService) {
			$scope.isCordova = isCordova;
			
			$scope.submitted = RecipeService.data.submitted;
			$scope.recipe = RecipeService.data.recipe;
			$scope.factorAvailable = RecipeService.data.factorAvailable;
			$scope.factor = RecipeService.data.factor;
			$scope.allowEdit = RecipeService.data.allowEdit;
			$scope.userExists = RecipeService.data.userExists;
      
			$scope.favorite = function() {
		    RecipeService.setFavorite();
		  }
		  $scope.unfavorite = function() {
		    RecipeService.unsetFavorite();
		  }
			$scope.save = function() {
		    RecipeService.create();
		  }
			$scope.update = function() {
		    RecipeService.update();
		  }
			$scope.remove = function() {
		    RecipeService.remove();
		  }
			$scope.cancel = function() {
		    RecipeService.cancel();
		  };
      
      $scope.$on("submittedValueChanged", function(){
				$scope.submitted = RecipeService.data.submitted;
      });

			$scope.clearImage = function(){
				$scope.recipe.imagePath =  "no_image.png";
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
          RecipeService.data.validForm = newVal;
      });

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
    
    
    .controller('RecipeDetailActionsCtrl', ['$rootScope', '$scope', '$uibModal', 'RecipeService', function ($rootScope, $scope, $uibModal, RecipeService) {
    		
			$scope.submitted = RecipeService.data.submitted;
			$scope.recipe = RecipeService.data.recipe;
			$scope.allowEdit = RecipeService.data.allowEdit;
			$scope.userExists = RecipeService.data.userExists;
			
      
			$scope.favorite = function() {
		    RecipeService.setFavorite();
		  }
		  $scope.unfavorite = function() {
		    RecipeService.unsetFavorite();
		  }
			$scope.save = function() {
		    RecipeService.create();
		  }
			$scope.update = function() {
		    RecipeService.update();
		  }
			$scope.remove = function() {
		    RecipeService.remove();
		  }
			$scope.cancel = function() {
		    RecipeService.cancel();
		  };

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

      }
    }])
    
    
    .controller('RecipeDetailActionSidebarCtrl', ['$rootScope', '$scope', '$uibModal', 'RecipeService', '$modalInstance', function ($rootScope, $scope, $uibModal, RecipeService, $modalInstance) {
			
			$scope.submitted = RecipeService.data.submitted;
			$scope.recipe = RecipeService.data.recipe;
			$scope.allowEdit = RecipeService.data.allowEdit;
			$scope.userExists = RecipeService.data.userExists;
			
      
			$scope.favorite = function() {
		    RecipeService.setFavorite();
		  }
		  $scope.unfavorite = function() {
		    RecipeService.unsetFavorite();
		  }
			$scope.save = function() {
				RecipeService.data.submitted = true;
		    RecipeService.create();
		  }
			$scope.update = function() {
				RecipeService.data.submitted = true;
		    RecipeService.update();
		  }
			$scope.remove = function() {
		    RecipeService.remove();
		  }
			$scope.cancel = function() {
		    RecipeService.cancel();
		  };

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

  .config(['$stateProvider', 'modalStateProvider', '$urlRouterProvider', function ($stateProvider, modalStateProvider, $urlRouterProvider) {

		function getDishtypeState(title, url, params) {
			return {
				url: url,
				params: params,
				views: {
	    		'main@user': {
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
				},
				data: {
		      title: title
				}
			};
		};
		
		
		function getRecipeDetailState(){
			return {
				abstract: true,
				url: "/details/:id",
				views: {
					'main@user': {
						templateUrl: 'partials/recipes.details.layout.tpl.html',
					}
				},
				resolve: {
					recipe: ['Recipes', '$stateParams', 'RecipeService', function(Recipes, $stateParams, RecipeService){
						var recipe = Recipes.get({'id': $stateParams.id}, function(response) {
							RecipeService.setRecipe(response);
						}).$promise;
						return recipe;
					}],
					units: function(Units){
						return Units.query().$promise;
					},
					dishtypes: function(DishTypes){
						return DishTypes.query().$promise;
					}
				}
			};	
		}
		
		function getRecipeDetailViewState(){
			return {
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
				
 			};
		}
		
		function getRecipeDetailEditState(){
			return {
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
 			};
		}
		
		function getRecipeScheduleAddState(){
			return {
      	url: '/scheduleadd',
      	templateUrl: 'partials/recipes.scheduleadd.tpl.html',
		    controller: 'ModalScheduleAddController',
				params: {
					date: undefined,
					recipe: undefined
				},
		    resolve: {
          randomRecipes: [ 'RandomRecipe', function(RandomRecipe){
						var randomRecipes = RandomRecipe.query({'number': '3'}, function(response){
							return response;
						});
						
						return randomRecipes;
          }]
		    }
      };
		}


    $stateProvider
		.state('user.recipes', {
			url: "/recipes",
			views: {
    		'main': {
	    		templateUrl: 'partials/recipes.dishtypes.tpl.html',
					controller: 'RecipeDishTypeController'
				},
				'actionnavigation-xs@': {
	    		template: '<button type="button" class="navbar-toggle actionbutton" ui-sref="user.recipes.details.add"><i class="glyphicon glyphicon-plus"></i></button>',
					controller: 'ActionSidebarRecipeController'
				}
			},
			resolve: {
				recipeCount: ['$http', 'BASE_URI', function($http, BASE_URI){
					return $http.get(BASE_URI+'api/recipes/count').success(function(data) {
						return data;
					});
				}]
			},
			data: {
	      title: 'Recipes'
			}
		})
		
		.state('user.recipes.breakfast', getDishtypeState('Breakfast', '/breakfast', {
					dishType: '56294bad07ee48b60ec4405b',
					author: undefined,
					new_recipe: undefined,
					fav_recipe: undefined
			})
		)
		.state('user.recipes.breakfast.details', getRecipeDetailState())
		.state('user.recipes.breakfast.details.view', getRecipeDetailViewState())
		.state('user.recipes.breakfast.details.edit', getRecipeDetailEditState())
		.state('user.recipes.appetizer', getDishtypeState('Appetizer', '/appetizer', {
					dishType: '562934ae137c052908b75e23',
					author: undefined,
					new_recipe: undefined,
					fav_recipe: undefined
			})
		)
		.state('user.recipes.appetizer.details', getRecipeDetailState())
		.state('user.recipes.appetizer.details.view', getRecipeDetailViewState())
		.state('user.recipes.appetizer.details.edit', getRecipeDetailEditState())
		.state('user.recipes.drinks', getDishtypeState('Drinks', '/drinks', {
					dishType: '562940bd4bdc01930dca94d8',
					author: undefined,
					new_recipe: undefined,
					fav_recipe: undefined
			})
		)
		.state('user.recipes.drinks.details', getRecipeDetailState())
		.state('user.recipes.drinks.details.view', getRecipeDetailViewState())
		.state('user.recipes.drinks.details.edit', getRecipeDetailEditState())
		.state('user.recipes.salads', getDishtypeState('Salads', '/salads', {
					dishType: '562940db4bdc01930dca94da',
					author: undefined,
					new_recipe: undefined,
					fav_recipe: undefined
			})
		)
		.state('user.recipes.salads.details', getRecipeDetailState())
		.state('user.recipes.salads.details.view', getRecipeDetailViewState())
		.state('user.recipes.salads.details.edit', getRecipeDetailEditState())
		.state('user.recipes.maindishes', getDishtypeState('Main Dishes', '/maindishes', {
					dishType: '56293446137c052908b75e22',
					author: undefined,
					new_recipe: undefined,
					fav_recipe: undefined
			})
		)
		.state('user.recipes.maindishes.details', getRecipeDetailState())
		.state('user.recipes.maindishes.details.view', getRecipeDetailViewState())
		.state('user.recipes.maindishes.details.edit', getRecipeDetailEditState())
		.state('user.recipes.sidedishes', getDishtypeState('Side Dishes', '/sidedishes', {
					dishType: '562940cc4bdc01930dca94d9',
					author: undefined,
					new_recipe: undefined,
					fav_recipe: undefined
			})
		)
		.state('user.recipes.sidedishes.details', getRecipeDetailState())
		.state('user.recipes.sidedishes.details.view', getRecipeDetailViewState())
		.state('user.recipes.sidedishes.details.edit', getRecipeDetailEditState())
		.state('user.recipes.desserts', getDishtypeState('Desserts', '/desserts', {
					dishType: '562940ee4bdc01930dca94db',
					author: undefined,
					new_recipe: undefined,
					fav_recipe: undefined
			})
		)
		.state('user.recipes.desserts.details', getRecipeDetailState())
		.state('user.recipes.desserts.details.view', getRecipeDetailViewState())
		.state('user.recipes.desserts.details.edit', getRecipeDetailEditState())
		.state('user.recipes.breads', getDishtypeState('Breads', '/breads', {
					dishType: '562aabc37a696f1229593c42',
					author: undefined,
					new_recipe: undefined,
					fav_recipe: undefined
			})
		)
		.state('user.recipes.breads.details', getRecipeDetailState())
		.state('user.recipes.breads.details.view', getRecipeDetailViewState())
		.state('user.recipes.breads.details.edit', getRecipeDetailEditState())
		.state('user.recipes.eveningsnacks', getDishtypeState('Evening Snacks', '/eveningsnacks', {
					dishType: '5668a3b36faed8e960d4f213',
					author: undefined,
					new_recipe: undefined,
					fav_recipe: undefined
			})
		)
		.state('user.recipes.eveningsnacks.details', getRecipeDetailState())
		.state('user.recipes.eveningsnacks.details.view', getRecipeDetailViewState())
		.state('user.recipes.eveningsnacks.details.edit', getRecipeDetailEditState())
		.state('user.recipes.other', getDishtypeState('Other Recipes', '/other', {
					dishType: '5629f52a2b9118f35b96c2ca',
					author: undefined,
					new_recipe: undefined,
					fav_recipe: undefined
			})
		)
		.state('user.recipes.other.details', getRecipeDetailState())
		.state('user.recipes.other.details.view', getRecipeDetailViewState())
		.state('user.recipes.other.details.edit', getRecipeDetailEditState())
		.state('user.recipes.all', getDishtypeState('All Recipes', '/all', {
					dishType: undefined,
					author: undefined,
					new_recipe: undefined,
					fav_recipe: undefined
			})
		)
		.state('user.recipes.all.details', getRecipeDetailState())
		.state('user.recipes.all.details.view', getRecipeDetailViewState())
		.state('user.recipes.all.details.edit', getRecipeDetailEditState())
		.state('user.recipes.my', getDishtypeState('My Recipes', '/my', {
					dishType: undefined,
					author: 'self',
					new_recipe: undefined,
					fav_recipe: undefined
			})
		)
		.state('user.recipes.my.details', getRecipeDetailState())
		.state('user.recipes.my.details.view', getRecipeDetailViewState())
		.state('user.recipes.my.details.edit', getRecipeDetailEditState())
		.state('user.recipes.new', getDishtypeState('New Recipes', '/new', {
					dishType: undefined,
					author: undefined,
					new_recipe: true,
					fav_recipe: undefined
			})
		)
		.state('user.recipes.new.details', getRecipeDetailState())
		.state('user.recipes.new.details.view', getRecipeDetailViewState())
		.state('user.recipes.new.details.edit', getRecipeDetailEditState())
		.state('user.recipes.favorites', getDishtypeState('Favorite Recipes', '/favorites', {
					dishType: undefined,
					author: undefined,
					new_recipe: undefined,
					fav_recipe: true
			})
		)
		.state('user.recipes.favorites.details', getRecipeDetailState())
		.state('user.recipes.favorites.details.view', getRecipeDetailViewState())
		.state('user.recipes.favorites.details.edit', getRecipeDetailEditState())
		
			.state('user.recipes.details', {
				abstract: true,
				url: "/details/:id",
				params: {factor: null},
				views: {
					'main@user': {
						templateUrl: 'partials/recipes.details.layout.tpl.html',
					}
				},
				resolve: {
					recipe: ['Recipes', '$stateParams', 'RecipeService', function(Recipes, $stateParams, RecipeService){
						if ($stateParams.id) {
							var recipe = Recipes.get({'id': $stateParams.id}, function(response) {
								response.ingredients.push({qty: '', unit: '', ingredient: ''});
								RecipeService.setRecipe(response, $stateParams.factor);
							}).$promise;
							return recipe;
						} else {
							var recipe = new Recipes();
							recipe.ingredients = [];
							recipe.ingredients.push({qty: '', unit: '', ingredient: ''});
							recipe.imagePath = "no_image.png";
							RecipeService.data.recipe = recipe;
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
  		.state('user.recipes.details.view', getRecipeDetailViewState())
  		.state('user.recipes.details.edit', getRecipeDetailEditState())
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
					recipe: ['Recipes', '$stateParams', 'RecipeService', function(Recipes, $stateParams, RecipeService){
						if ($stateParams.id) {
								var recipe = Recipes.get({'id': $stateParams.id}, function(response) {
									response.ingredients.push({qty: '', unit: '', ingredient: ''});
									RecipeService.setRecipe(response, $stateParams.factor);
								}).$promise;
							return recipe;
						} else {
							var recipe = new Recipes();
							recipe.ingredients = [];
							recipe.ingredients.push({qty: '', unit: '', ingredient: ''});
							recipe.imagePath = "no_image.png";
							RecipeService.data.recipe = recipe;
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
    
    modalStateProvider
      .state('user.recipes.breakfast.details.view.scheduleadd', getRecipeScheduleAddState())
      .state('user.recipes.appetizer.details.view.scheduleadd', getRecipeScheduleAddState())
      .state('user.recipes.drinks.details.view.scheduleadd', getRecipeScheduleAddState())
      .state('user.recipes.salads.details.view.scheduleadd', getRecipeScheduleAddState())
      .state('user.recipes.maindisches.details.view.scheduleadd', getRecipeScheduleAddState())
      .state('user.recipes.sidedisches.details.view.scheduleadd', getRecipeScheduleAddState())
      .state('user.recipes.desserts.details.view.scheduleadd', getRecipeScheduleAddState())
      .state('user.recipes.breads.details.view.scheduleadd', getRecipeScheduleAddState())
      .state('user.recipes.eveningsnacks.details.view.scheduleadd', getRecipeScheduleAddState())
      .state('user.recipes.other.details.view.scheduleadd', getRecipeScheduleAddState())
      .state('user.recipes.all.details.view.scheduleadd', getRecipeScheduleAddState())
      .state('user.recipes.my.details.view.scheduleadd', getRecipeScheduleAddState())
      .state('user.recipes.new.details.view.scheduleadd', getRecipeScheduleAddState())
      .state('user.recipes.favorites.details.view.scheduleadd', getRecipeScheduleAddState())
      
      .state('user.recipes.breakfast.scheduleadd', getRecipeScheduleAddState())
      .state('user.recipes.appetizer.scheduleadd', getRecipeScheduleAddState())
      .state('user.recipes.drinks.scheduleadd', getRecipeScheduleAddState())
      .state('user.recipes.salads.scheduleadd', getRecipeScheduleAddState())
      .state('user.recipes.maindisches.scheduleadd', getRecipeScheduleAddState())
      .state('user.recipes.sidedisches.scheduleadd', getRecipeScheduleAddState())
      .state('user.recipes.desserts.scheduleadd', getRecipeScheduleAddState())
      .state('user.recipes.breads.scheduleadd', getRecipeScheduleAddState())
      .state('user.recipes.eveningsnacks.scheduleadd', getRecipeScheduleAddState())
      .state('user.recipes.other.scheduleadd', getRecipeScheduleAddState())
      .state('user.recipes.all.scheduleadd', getRecipeScheduleAddState())
      .state('user.recipes.my.scheduleadd', getRecipeScheduleAddState())
      .state('user.recipes.new.scheduleadd', getRecipeScheduleAddState())
      .state('user.recipes.favorites.scheduleadd', getRecipeScheduleAddState())
    ;
    
  }])
;


