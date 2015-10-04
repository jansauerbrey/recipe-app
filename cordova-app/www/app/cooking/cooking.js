angular.module('app.cooking', ['ui.router'])

//---------------
// Controllers
//---------------


// Cooking

    .controller('CookingController', ['$scope', '$stateParams', 'Schedules', 'Recipes', 'Ingredients', 'Units', 'Tags', 'User', '$state', function ($scope, $stateParams, Schedules, Recipes, Ingredients, Units, Tags, User, $state) {
      if (!$stateParams.date) {
        $scope.startDate = new Date();
      }
      else {
        $scope.startDate = new Date($stateParams.date);
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
// Routes
//---------------

  .config(['$stateProvider', '$urlRouterProvider', function ($stateProvider, $urlRouterProvider) {

    $stateProvider
      		.state('user.cooking', {
			url: '/cooking/:date',
        		templateUrl: 'partials/cooking.date.tpl.html',
        		controller: 'CookingController',
			data: {
				name: 'Cooking',
				icon: 'glyphicon glyphicon-fire'
			}
      		})
    ;
  }])
;

