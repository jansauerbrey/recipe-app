angular.module('app.auth', ['ui.router'])

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
            },
            updateFavoriteRecipes = function(favRecipes) {
                if (currentUser !== undefined){
	                currentUser.favoriteRecipes = favRecipes;
	                $localStorage.user.favoriteRecipes = favRecipes;
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
            getToken: getToken,
            updateFavoriteRecipes: updateFavoriteRecipes
        }

    }])


    .factory('AuthenticationService', [ '$http', '$localStorage', '$state', '$timeout', 'UserService', 'BASE_URI', function($http, $localStorage, $state, $timeout, UserService, BASE_URI) {
        var logIn = function(username, password, autologin) {
                return $http.post(BASE_URI+'api/user/login', {username: username, password: password, autologin: autologin}).success(function(data) {
                    data.permissions = ["User"];
                    if (data.is_admin) {
                        data.permissions.push("Admin");
                    }
                    UserService.createUser(data);
                    return true;
                }).error(function(err){
									alert("Network connection or certificate error");
								});
            },
            logOut = function() {
                $http.get(BASE_URI+'api/user/logout').success(function(){
                  UserService.deleteCurrentUser();
        					$timeout(function () {
          					$state.go("anon.user.login");
        					}, 2000);
                });
            },
            register = function(user) {
                return $http.post(BASE_URI+'api/user/register', user);
            };

        return {
            logIn: logIn,
            logOut: logOut,
            register: register
        }
    }])

    .factory('AuthorisationService', ['UserService', function(UserService) {
	var authorize = function (requiresLogin, requiredPermissions, permissionType) {
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


    .factory('TokenInterceptor', ['$q', 'UserService', '$injector', function ($q, UserService, $injector) {
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
		    var stateService = $injector.get('$state');
                    stateService.go('accessdenied');
                }

                return $q.reject(rejection);
            }
        };
    }])

        .factory('User', ['$resource', 'BASE_URI', function($resource, BASE_URI){
          return $resource(BASE_URI+'api/user/info/:id');
        }])



//---------------
// Controllers
//---------------


// Auth

    .controller('UserCtrl', ['$scope', '$state', 'Users', 'AuthenticationService',
        function UserCtrl($scope, $state, Users, AuthenticationService) {
 
        $scope.logIn = function logIn(username, password, autologin) {
            if (username !== undefined && password !== undefined) { 
                AuthenticationService.logIn(username, password, autologin).then(function(){
	          $state.go("user.home");
                });
            }
        }
 
        $scope.user = new Users();

        $scope.register = function register() {
	    AuthenticationService.register($scope.user).success(function(data) {
	        $state.go("anon.user.login");
	    });
	}
    }])



    .controller('UserLogout', ['$scope', '$state', '$localStorage', 'AuthenticationService',
        function UserLogout($scope, $state, $localStorage, AuthenticationService) {
        AuthenticationService.logOut();
    }])


    .controller('UserForgotCtrl', ['$scope', '$state', '$stateParams', '$http', 'BASE_URI',
        function UserForgotCtrl($scope, $state, $stateParams, $http, BASE_URI) {
 
        $scope.requestNewPassword = function requestNewPassword(username) {
            if (username !== undefined ) { 
		return $http.post(BASE_URI+'api/user/forgot', {username: username}).success(function(data) {
                    $state.go("anon.user.login");
                });
            }
        }

        $scope.resetPassword = function resetPassword(password, passwordConfirmation) {
            if (password !== undefined && password === passwordConfirmation ) { 
		return $http.put(BASE_URI+'api/user/reset/'+$stateParams.token, {password: password, passwordConfirmation: passwordConfirmation}).success(function(data) {
                    $state.go("anon.user.login");
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

  .config(['$stateProvider', '$urlRouterProvider', function ($stateProvider, $urlRouterProvider) {

   $stateProvider
		.state('anon.user.register', {
			url: '/register',
        		templateUrl: 'partials/user.register.tpl.html',
        		controller: 'UserCtrl',
			data: {
	        		name: 'Register',
        			icon: 'glyphicon glyphicon-edit',
	      title: 'Register',
				panelright: true
			}
      		})
      		.state('anon.user.login', {
			url: '/login',
        		templateUrl: 'partials/user.login.tpl.html',
        		controller: 'UserCtrl',
			data: {
	        		name: 'Login',
        			icon: 'glyphicon glyphicon-log-in',
	      title: 'Login',
				panelright: true
			}
      		})
      		.state('user.logout', {
			url: '/user/logout',
        		templateUrl: 'partials/user.logout.tpl.html',
        		controller: 'UserLogout',
			data: {
				name: 'Logout',
				icon: 'glyphicon glyphicon-log-out',
	      title: 'Logout',
				panelright: true
			}
      		})
      		.state('anon.forgot', {
			url: '/user/forgot',
        		templateUrl: 'partials/user.forgot.tpl.html',
        		controller: 'UserForgotCtrl',
			data: {
	      title: 'Forgot password'
			}
      		})
      		.state('anon.reset', {
			url: '/user/reset/:token',
        		templateUrl: 'partials/user.reset.tpl.html',
        		controller: 'UserForgotCtrl',
			data: {
	      title: 'Reset password'
			}
      		})
    ;
  }])
;


