angular.module('app.admin', ['ui.router'])

//---------------
// Services
//---------------


        .factory('Users', ['$resource', 'BASE_URI', function($resource, BASE_URI){
          return $resource(BASE_URI+'api/admin/user/:id', null, {
            'update': { method:'PUT' }
          });
        }])

//---------------
// Controllers
//---------------


// Admin

    .controller('AdminUserCtrl', ['$scope', '$state', 'Users', function ($scope, $state, Users) {
      $scope.loading = true;
      $scope.users = Users.query(function(response) {
        $scope.loading = false;
      });

      $scope.remove = function(user){
        Users.remove({id: user._id}, function(){
          $scope.users.splice($scope.users.indexOf(user), 1);
        });
      }

      $scope.activate = function(user){
        $scope.users[$scope.users.indexOf(user)].is_activated = true;
        Users.update({id: user._id}, {is_activated: true}, function(){
        });
      }

      $scope.makeAdmin = function(user){
        $scope.users[$scope.users.indexOf(user)].is_admin = true;
        Users.update({id: user._id}, {is_admin: true}, function(){
        });
      }

      $scope.removeAdmin = function(user){
        $scope.users[$scope.users.indexOf(user)].is_admin = false;
        Users.update({id: user._id}, {is_admin: false}, function(){
        });
      }

    }])


//---------------
// Routes
//---------------

  .config(['$stateProvider', '$urlRouterProvider', function ($stateProvider, $urlRouterProvider) {

    $stateProvider
		.state('admin', {
			abstract: true,
			template: "<ui-view />",
			data: {
				requiresLogin: true,
                 		requiredPermissions: ['Admin']
			}
		})
      		.state('admin.user', {
			url: '/admin/user',
        		templateUrl: 'partials/admin.user.tpl.html',
        		controller: 'AdminUserCtrl',
			data: {
	        		name: 'Users',
        			icon: 'glyphicon glyphicon-user'
			}
      		})
    ;
  }])
;


