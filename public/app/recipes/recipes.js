'use strict';

angular.module('recipeApp.recipes', ['ngRoute'])
  .config(['$routeProvider', function($routeProvider) {
    $routeProvider.when('/recipes', {
      templateUrl: 'partials/recipes.list.tpl.html',
      controller: 'RecipesCtrl'
    })
      .when('/recipes/add', {
        templateUrl: 'partials/recipes.edit.form.tpl.html',
        controller: 'RecipeEditCtrl'
      })
      .when('/recipes/:id', {
        templateUrl: 'partials/recipes.view.tpl.html',
        controller: 'RecipeViewCtrl'
      })
      .when('/recipes/:id/edit', {
        templateUrl: 'partials/recipes.edit.form.tpl.html',
        controller: 'RecipeEditCtrl'
      });
  }])
  .controller('RecipesCtrl', ['$scope', '$http', '$location', 'alertService',
    function($scope, $http, $location, alertService) {
      $scope.recipes = [];
      $scope.order = 'name';
      $scope.reverse = false;
      $scope.loading = true;
      $scope.error = null;
      $scope.searchQuery = '';
      $scope.selectedTags = [];
      $scope.selectedDishTypes = [];

      // Load recipes
      $http.get('/api/recipes')
        .then(function(response) {
          $scope.recipes = response.data;
          $scope.loading = false;
        })
        .catch(function(error) {
          $scope.error = error.data?.error || 'Failed to load recipes';
          $scope.loading = false;
          alertService.error($scope.error);
        });

      // Load tags
      $http.get('/api/tags')
        .then(function(response) {
          $scope.tags = response.data;
        })
        .catch(function(error) {
          alertService.error(error.data?.error || 'Failed to load tags');
        });

      // Load dish types
      $http.get('/api/dishtypes')
        .then(function(response) {
          $scope.dishTypes = response.data;
        })
        .catch(function(error) {
          alertService.error(error.data?.error || 'Failed to load dish types');
        });

      $scope.setOrder = function(order) {
        if ($scope.order === order) {
          $scope.reverse = !$scope.reverse;
        } else {
          $scope.order = order;
          $scope.reverse = false;
        }
      };

      $scope.addRecipe = function() {
        $location.path('/recipes/add');
      };

      $scope.viewRecipe = function(recipe) {
        $location.path('/recipes/' + recipe._id);
      };

      $scope.editRecipe = function(recipe) {
        $location.path('/recipes/' + recipe._id + '/edit');
      };

      $scope.deleteRecipe = function(recipe) {
        if (!confirm('Are you sure you want to delete this recipe?')) {
          return;
        }

        $http.delete('/api/recipes/' + recipe._id)
          .then(function() {
            $scope.recipes = $scope.recipes.filter(item => item._id !== recipe._id);
            alertService.success('Recipe deleted successfully');
          })
          .catch(function(error) {
            alertService.error(error.data?.error || 'Failed to delete recipe');
          });
      };

      $scope.toggleTag = function(tag) {
        const index = $scope.selectedTags.findIndex(t => t._id === tag._id);
        if (index === -1) {
          $scope.selectedTags.push(tag);
        } else {
          $scope.selectedTags.splice(index, 1);
        }
      };

      $scope.toggleDishType = function(dishType) {
        const index = $scope.selectedDishTypes.findIndex(dt => dt._id === dishType._id);
        if (index === -1) {
          $scope.selectedDishTypes.push(dishType);
        } else {
          $scope.selectedDishTypes.splice(index, 1);
        }
      };

      $scope.isTagSelected = function(tag) {
        return $scope.selectedTags.some(t => t._id === tag._id);
      };

      $scope.isDishTypeSelected = function(dishType) {
        return $scope.selectedDishTypes.some(dt => dt._id === dishType._id);
      };

      $scope.filterRecipes = function(recipe) {
        const matchesSearch = !$scope.searchQuery ||
          recipe.name.toLowerCase().includes($scope.searchQuery.toLowerCase()) ||
          recipe.description?.toLowerCase().includes($scope.searchQuery.toLowerCase());

        const matchesTags = $scope.selectedTags.length === 0 ||
          $scope.selectedTags.every(tag => recipe.tags?.some(t => t._id === tag._id));

        const matchesDishTypes = $scope.selectedDishTypes.length === 0 ||
          $scope.selectedDishTypes.every(dt => recipe.dishTypes?.some(d => d._id === dt._id));

        return matchesSearch && matchesTags && matchesDishTypes;
      };

      $scope.clearFilters = function() {
        $scope.searchQuery = '';
        $scope.selectedTags = [];
        $scope.selectedDishTypes = [];
      };
    }
  ])
  .controller('RecipeViewCtrl', ['$scope', '$http', '$routeParams', '$location', 'alertService',
    function($scope, $http, $routeParams, $location, alertService) {
      $scope.loading = true;
      $scope.error = null;

      $http.get('/api/recipes/' + $routeParams.id)
        .then(function(response) {
          $scope.recipe = response.data;
          $scope.loading = false;
        })
        .catch(function(error) {
          $scope.error = error.data?.error || 'Failed to load recipe';
          $scope.loading = false;
          alertService.error($scope.error);
        });

      $scope.editRecipe = function() {
        $location.path('/recipes/' + $scope.recipe._id + '/edit');
      };

      $scope.deleteRecipe = function() {
        if (!confirm('Are you sure you want to delete this recipe?')) {
          return;
        }

        $http.delete('/api/recipes/' + $scope.recipe._id)
          .then(function() {
            alertService.success('Recipe deleted successfully');
            $location.path('/recipes');
          })
          .catch(function(error) {
            alertService.error(error.data?.error || 'Failed to delete recipe');
          });
      };
    }
  ])
  .controller('RecipeEditCtrl', ['$scope', '$http', '$routeParams', '$location', 'alertService',
    function($scope, $http, $routeParams, $location, alertService) {
      $scope.loading = true;
      $scope.error = null;
      $scope.isNew = !$routeParams.id;

      if (!$scope.isNew) {
        $http.get('/api/recipes/' + $routeParams.id)
          .then(function(response) {
            $scope.recipe = response.data;
            $scope.loading = false;
          })
          .catch(function(error) {
            $scope.error = error.data?.error || 'Failed to load recipe';
            $scope.loading = false;
            alertService.error($scope.error);
          });
      } else {
        $scope.recipe = {
          ingredients: [],
          steps: [],
          tags: [],
          dishTypes: [],
        };
        $scope.loading = false;
      }

      // Load tags
      $http.get('/api/tags')
        .then(function(response) {
          $scope.tags = response.data;
        })
        .catch(function(error) {
          alertService.error(error.data?.error || 'Failed to load tags');
        });

      // Load dish types
      $http.get('/api/dishtypes')
        .then(function(response) {
          $scope.dishTypes = response.data;
        })
        .catch(function(error) {
          alertService.error(error.data?.error || 'Failed to load dish types');
        });

      $scope.addIngredient = function() {
        $scope.recipe.ingredients.push({});
      };

      $scope.removeIngredient = function(index) {
        $scope.recipe.ingredients.splice(index, 1);
      };

      $scope.addStep = function() {
        $scope.recipe.steps.push('');
      };

      $scope.removeStep = function(index) {
        $scope.recipe.steps.splice(index, 1);
      };

      $scope.toggleTag = function(tag) {
        const index = $scope.recipe.tags.findIndex(t => t._id === tag._id);
        if (index === -1) {
          $scope.recipe.tags.push(tag);
        } else {
          $scope.recipe.tags.splice(index, 1);
        }
      };

      $scope.toggleDishType = function(dishType) {
        const index = $scope.recipe.dishTypes.findIndex(dt => dt._id === dishType._id);
        if (index === -1) {
          $scope.recipe.dishTypes.push(dishType);
        } else {
          $scope.recipe.dishTypes.splice(index, 1);
        }
      };

      $scope.isTagSelected = function(tag) {
        return $scope.recipe.tags.some(t => t._id === tag._id);
      };

      $scope.isDishTypeSelected = function(dishType) {
        return $scope.recipe.dishTypes.some(dt => dt._id === dishType._id);
      };

      $scope.saveRecipe = function() {
        if (!$scope.recipe.name) {
          alertService.error('Name is required');
          return;
        }

        const method = $scope.isNew ? 'post' : 'put';
        const url = '/api/recipes' + ($scope.isNew ? '' : '/' + $scope.recipe._id);

        $http[method](url, $scope.recipe)
          .then(function(response) {
            alertService.success('Recipe ' + ($scope.isNew ? 'created' : 'updated') + ' successfully');
            $location.path('/recipes/' + response.data._id);
          })
          .catch(function(error) {
            alertService.error(error.data?.error || 'Failed to save recipe');
          });
      };

      $scope.cancel = function() {
        if ($scope.isNew) {
          $location.path('/recipes');
        } else {
          $location.path('/recipes/' + $scope.recipe._id);
        }
      };
    }
  ]);
