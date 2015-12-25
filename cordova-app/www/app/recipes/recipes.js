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
          var recipe;
          var recipeOrig;
          var factorAvailable;
          var factor;
					var allowEdit;
          var submitted = false;
          var validForm = false;
          var alerts = [];
          
          var setRecipe = function(recipeItem, factor){
          	this.recipe = recipeItem;
          	this.recipeOrig = angular.copy(this.recipe);
          	this.factorAvailable = factor > 0 ? true : false;
          	this.factor = this.factorAvailable ? factor : this.recipe.yield;
          	var user = UserService.getCurrentLoginUser();
						if (this.recipe.author && user._id == this.recipe.author._id || user.is_admin === true) {
							this.allowEdit = true;
						} else {
							this.allowEdit = false;
						}
          }
          var create = function(){
			        if(!this.validForm){
								this.alerts.push({type: 'danger', msg: 'Please complete all required fields before saving.'})
								this.submitted = true;
								$rootScope.$broadcast("submittedValueChanged");
			          return;
			        }
			        if(!this.recipe || this.recipe.length < 1) return;
			        this.recipe.ingredients = this.recipe.ingredients.filter(function(n){ return n != ''});
			        for(i=0;i<this.recipe.tags.length;i++){
			          if (!this.recipe.tags[i]._id){
			            var tag = new Tags(this.recipe.tags[i]);
			            tag.$save();
			            this.recipe.tags[i] = tag._id;
			          }
			        }
			        for(i=0;i<this.recipe.ingredients.length;i++){
			          if (!(this.recipe.ingredients[i].ingredient && this.recipe.ingredients[i].ingredient._id)) {
			            this.recipe.ingredients.splice(i, 1);
			          }
			        }
			        
			        delete this.recipe._id;
			        this.recipe.$save(function(response){
			          $state.go('user.recipes.details.view', {id: response._id});
			        });
			      };
			      var update = function(){
							if(!this.validForm){
								this.alerts.push({type: 'danger', msg: 'Please complete all required fields before saving.'})
								this.submitted = true;
								$rootScope.$broadcast("submittedValueChanged");
								return;
							}
							for(i=0;i<this.recipe.tags.length;i++){
								if (!this.recipe.tags[i]._id){
									var tag = new Tags(this.recipe.tags[i]);
									tag.$save();
									this.recipe.tags[i] = tag._id;
								}
							}
							this.recipe.ingredients = this.recipe.ingredients.filter(function(n){ return n != ''});
							for(i=0;i<this.recipe.ingredients.length;i++){
								if (!(this.recipe.ingredients[i].ingredient && this.recipe.ingredients[i].ingredient._id)) {
									this.recipe.ingredients.splice(i, 1);
								}
							}

							Recipes.update({id: this.recipe._id}, this.recipe, function(response){
								setRecipe(response);
								$state.go($rootScope.previousState.name, $rootScope.previousStateParams);
							});
					  };
					  var remove = function(){
							Recipes.remove({id: this.recipe._id}, function(){
								if ($rootScope.previousState.name === 'user.recipes.details.edit' ) {
									$state.go('user.recipes.dishtypes');
								} else {
									$state.go($rootScope.previousState.name, $rootScope.previousStateParams);
								}
							});
						};
						var cancel = function(){
							this.recipe = angular.copy(this.recipeOrig);
							$state.go($rootScope.previousState.name, $rootScope.previousStateParams);
						};
						var setFavorite = function(){
							var parent = this;
							Favorites.update({id: this.recipe._id}, {method: 'add'}, function(response){
								UserService.updateFavoriteRecipes(response.favoriteRecipes);
								parent.recipe.fav_recipe = true;
							});
						};
						var unsetFavorite = function(){
							var parent = this;
							Favorites.update({id: this.recipe._id}, {method: 'delete'}, function(response){
								UserService.updateFavoriteRecipes(response.favoriteRecipes);
								parent.recipe.fav_recipe = false;
							});
						};
						        
          return {
          	recipe: recipe,
          	submitted: submitted,
          	validForm: validForm,
          	alerts: alerts,
          	factorAvailable: factorAvailable,
          	factor: factor,
          	allowEdit: allowEdit,
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
			
			$scope.alerts = recipeActions.alerts;
			$scope.submitted = recipeActions.submitted;
			$scope.recipe = recipeActions.recipe;
			$scope.factorAvailable = recipeActions.factorAvailable;
			$scope.factor = recipeActions.factor;
			$scope.allowEdit = recipeActions.allowEdit;
      
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
				$scope.submitted = recipeActions.submitted;
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
          recipeActions.validForm = newVal;
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
    
    
    .controller('RecipeDetailActionsCtrl', ['$rootScope', '$scope', '$uibModal', 'recipeActions', function ($rootScope, $scope, $uibModal, recipeActions) {
    		
			$scope.alerts = recipeActions.alerts;
			$scope.submitted = recipeActions.submitted;
			$scope.recipe = recipeActions.recipe;
			$scope.allowEdit = recipeActions.allowEdit;
			
      
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

    }])
    
    
    .controller('RecipeDetailActionSidebarCtrl', ['$rootScope', '$scope', '$uibModal', 'recipeActions', '$modalInstance', function ($rootScope, $scope, $uibModal, recipeActions, $modalInstance) {
			
			$scope.alerts = recipeActions.alerts;
			$scope.submitted = recipeActions.submitted;
			$scope.recipe = recipeActions.recipe;
			$scope.allowEdit = recipeActions.allowEdit;
			
      
			$scope.favorite = function() {
		    recipeActions.setFavorite();
		  }
		  $scope.unfavorite = function() {
		    recipeActions.unsetFavorite();
		  }
			$scope.save = function() {
				recipeActions.submitted = true;
		    recipeActions.create();
		  }
			$scope.update = function() {
				recipeActions.submitted = true;
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
              size: 'lg'
            });
          }
          
      $scope.recipeDetailsEdit = function() {
            var asideInstance = $aside.open({
              template: '<div ng-click="closeSidebar()" ng-include="\'partials/recipes.edit.links.tpl.html\'"></div>',
              controller: 'RecipeDetailActionSidebarCtrl',
              placement: 'right',
              size: 'lg'
            });
          }
          
      $scope.recipeDetailsAdd = function() {
            var asideInstance = $aside.open({
              template: '<div ng-click="closeSidebar()" ng-include="\'partials/recipes.add.links.tpl.html\'"></div>',
              controller: 'RecipeDetailActionSidebarCtrl',
              placement: 'right',
              size: 'lg'
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
				'actionnavigation@': {
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
				new_recipe: undefined,
				fav_recipe: undefined
			},
			views: {
    		'': {
	    		templateUrl: 'partials/recipes.list.tpl.html',
					controller: 'RecipeListController'
				},
				'actionnavigation@': {
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
							recipeActions.recipe = recipe;
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
					'actionnavigation@': {
		    		template: '<button type="button" class="navbar-toggle actionbutton" ng-click="recipeDetailsView()"><i class="glyphicon glyphicon-option-horizontal"></i></button>',
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
					'actionnavigation@': {
		    		template: '<button type="button" class="navbar-toggle actionbutton" ng-click="recipeDetailsEdit()"><i class="glyphicon glyphicon-option-horizontal"></i></button>',
						controller: 'ActionSidebarRecipeController'
					}
				}
 			})
  		.state('user.recipes.details.add', {
				url: '^/recipe/add',
				templateUrl: 'partials/recipes.details.layout.tpl.html',
				views: {
	    		'main': {
		    		templateUrl: 'partials/recipes.edit.form.tpl.html',
						controller: 'RecipeDetailCtrl'
					},
					'sidelinks': {
		    		templateUrl: 'partials/recipes.add.links.tpl.html',
						controller: 'RecipeDetailActionsCtrl'
					},
					'actionnavigation@': {
		    		template: '<button type="button" class="navbar-toggle actionbutton" ng-click="recipeDetailsAdd()"><i class="glyphicon glyphicon-option-horizontal"></i></button>',
						controller: 'ActionSidebarRecipeController'
					}
				}
  		})
    ;
  }])
;


