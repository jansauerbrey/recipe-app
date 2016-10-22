angular.module('app.auth', ['ui.router'])

//---------------
// Services
//---------------


// Auth


        .factory('User', ['$resource', 'BASE_URI', function($resource, BASE_URI){
          return $resource(BASE_URI+'api/user/info/:id', null, {
            'update': { method:'PUT' }
          });
        }])

		.factory('UserService', [ '$localStorage', '$injector', function($localStorage, $injector){
        var data = {currentUser: {},
        			currentUserCopy: {},
        			languageOptions: [{id: 'en', name: 'English'}, {id: 'de', name: 'Deutsch'},{id: 'fi', name: 'Suomi'}],
        			weekdayOptions: [{id: 0, name: 'Sunday'},
															{id: 1, name: 'Monday'},
															{id: 2, name: 'Tueasday'},
															{id: 3, name: 'Wednesday'},
															{id: 4, name: 'Thursday'},
															{id: 5, name: 'Friday'},
															{id: 6, name: 'Saturday'}]
						},
            createUser = function(userData){
                data.currentUser = userData;
                data.currentUserCopy = angular.copy(data.currentUser);
                $localStorage.user = userData;
            },
            getCurrentLoginUser = function(){
                return data.currentUser;
            },
            deleteCurrentUser = function(){
                delete data.currentUser;
                delete data.currentUserCopy;
                delete $localStorage.user;
            },
            isAuthenticated = function() {
              return (angular.isObject(data.currentUser) && ("_id" in data.currentUser));
            },
            getToken = function() {
                if (data.currentUser && data.currentUser.token){
                    return data.currentUser.token;
                }
            },
            authorize = function (requiresLogin, requiredPermissions, permissionType) {
							var result = 0,
							user = getCurrentLoginUser(),
							authenticated = isAuthenticated(),
							loweredPermissions = [],
							hasPermission = true,
							permission, i;
							
							permissionType = permissionType || 0;
							if (requiresLogin === true && user === undefined) {
								result = 1;
							} else if ((requiresLogin === true && authenticated === true) &&
								(requiredPermissions === undefined || requiredPermissions.length === 0)) {
								// Login is required but no specific permissions are specified.
								result = 0;
							} else if (requiredPermissions) {
								// fill NoUser info to user in case there is no user
								if (authenticated === false){
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
						},
            updateFavoriteRecipes = function(favRecipes) {
                if (data.currentUser !== undefined){
	                data.currentUser.favoriteRecipes = favRecipes;
	                data.currentUserCopy = angular.copy(data.currentUser);
	                $localStorage.user.favoriteRecipes = favRecipes;
                }
            },
            updateUserSettings = function(callback) {
              if (data.currentUser !== undefined){
              	var User = $injector.get('User');
              	User.update({id: data.currentUser._id}, {fullname: data.currentUserCopy.fullname, settings: data.currentUserCopy.settings}, function(response){
              		for (var attrname in response) {
              			data.currentUser[attrname] = response[attrname];
              		}
	                data.currentUserCopy = angular.copy(data.currentUser);
              		callback();
								});
              }
            };

            if ($localStorage.user){
                createUser($localStorage.user);
            }

			return {
				data: data,
				createUser: createUser,
				getCurrentLoginUser: getCurrentLoginUser,
				deleteCurrentUser: deleteCurrentUser,
				isAuthenticated: isAuthenticated,
				getToken: getToken,
				authorize: authorize,
				updateFavoriteRecipes: updateFavoriteRecipes,
				updateUserSettings: updateUserSettings
			}
		}])


    .factory('AuthenticationService', [ '$http', '$localStorage', '$state', '$stateParams', '$rootScope', 'UserService', 'BASE_URI', 'AlertService',
    	function($http, $localStorage, $state, $stateParams, $rootScope, UserService, BASE_URI, AlertService) {
    	var logIn = function(username, password, autologin) {
        if (username !== undefined && password !== undefined) {
        	$http.post(BASE_URI+'api/user/login', {username: username, password: password, autologin: autologin}).success(function(data) {
						data.permissions = ["User"];
						if (data.is_admin) {
							data.permissions.push("Admin");
						}
						UserService.createUser(data);
	      		$state.go("user.home");
					}).error(function(err){
						AlertService.add('info', 'If you have registered succesfully, please check your email to confirm your email address.');
					});
        } else {
					AlertService.add('danger', ' Please fill out username and password.');
        }
			},
			logOut = function() {
				$http.get(BASE_URI+'api/user/logout').success(function(){
					UserService.deleteCurrentUser();
					AlertService.add('success', 'You hav been successfully loged out.');
					$state.go("anon.startpage");
				}).error( function(){
					AlertService.add('danger', 'Network connection error.');
					$state.go($rootScope.previousState.name, $rootScope.previousStateParams);
				});
			},
			register = function(user) {
				$http.post(BASE_URI+'api/user/register', user).success(function(){
					AlertService.add('success', ' Please check your email to confirm your address and to activate your account.');
					$state.go("anon.user.login");
				}).error(function(err){
					AlertService.add('danger', 'Network or certificate error.');
				});
			},
			confirmEmail = function(){
				if($stateParams && $stateParams.token){
					$http.get(BASE_URI+'api/user/confirm/'+$stateParams.token).success(function(data) {
						AlertService.add('success', 'Email has been successfully confirmed. You are now able to login with your credentials.');
						$state.go("anon.user.login");
					}).error(function(err){
						AlertService.add('danger', 'Network or certificate error.');
					});
				}
			},
			requestNewPassword = function(username) {
        if (username !== undefined ) { 
					return $http.post(BASE_URI+'api/user/forgot', {username: username}).success(function(data) {
						AlertService.add('success', 'Password renewal process has been started. Please check your email for further instructions.');
						$state.go("anon.user.login");
					});
				} else {
						AlertService.add('danger', 'Please enter username.');
				}
			},
			resetPassword = function(password, passwordConfirmation) {
				if (password !== undefined && password === passwordConfirmation ) { 
					return $http.put(BASE_URI+'api/user/reset/'+$stateParams.token, {password: password, passwordConfirmation: passwordConfirmation}).success(function(data) {
						AlertService.add('success', 'Password has been reset successfully. Please use the new password to login.');
						$state.go("anon.user.login");
					});
				} else {
						AlertService.add('danger', 'Please enter the same password into password and password confirmation.');
				}
			};
			
			return {
				logIn: logIn,
				logOut: logOut,
				register: register,
				confirmEmail: confirmEmail,
				requestNewPassword: requestNewPassword,
				resetPassword: resetPassword
			}
		}])


    .factory('TokenInterceptor', ['$q', 'UserService', '$injector', 'AlertService', function ($q, UserService, $injector, AlertService) {
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
                    AlertService.add('danger', 'Access denied!');
		    						var $state = $injector.get('$state');
                    $state.go('anon.startpage');
                }

                return $q.reject(rejection);
            }
        };
    }])




//---------------
// Controllers
//---------------


// Auth
		
		.controller('UserAuthenticationController', ['$scope', 'Users', 'AuthenticationService', 'UserService',
			function UserAuthenticationController($scope, Users, AuthenticationService, UserService) {
			
			$scope.languageOptions = UserService.data.languageOptions;
			$scope.weekdayOptions = UserService.data.weekdayOptions;
			
			$scope.user = new Users();
			$scope.logIn = function logIn() {
				AuthenticationService.logIn($scope.login.username, $scope.login.password, $scope.login.autologin);
			}
			
			$scope.register = function register() {
				AuthenticationService.register($scope.user);
			}
		}])


		.controller('UserConfirmEmailController', ['AuthenticationService',
			function UserConfirmEmailController(AuthenticationService) {
				
			AuthenticationService.confirmEmail();
		}])


		.controller('UserLogoutController', ['AuthenticationService',
			function UserLogoutController(AuthenticationService) {
			
			AuthenticationService.logOut();
		}])


    .controller('UserPasswordRenewalController', ['$scope', 'AuthenticationService',
      function UserPasswordRenewalController($scope, AuthenticationService) {

			$scope.requestNewPassword = function(username) {
        AuthenticationService.requestNewPassword();
			}

			$scope.resetPassword = function(password, passwordConfirmation) {
				AuthenticationService.resetPassword();
			}
		}])
    
    
	.controller('UserSettingsController', ['$scope', '$state', 'UserService', 'AlertService',
		function UserSettingsController($scope, $state, UserService, AlertService) {
		
		$scope.languageOptions = UserService.data.languageOptions;
		$scope.weekdayOptions = UserService.data.weekdayOptions;
		
		// copy current user settings and link to data in factory
    UserService.data.currentUserCopy = angular.copy(UserService.data.currentUser);
		$scope.user = UserService.data.currentUserCopy;
		
		$scope.updateUserSettings = function updateUserSettings() {
			UserService.updateUserSettings(function(){
				AlertService.add('success', 'Settings successfully updated.');
				$state.go('user.settings');
			});
		}
		
	}])


//---------------
// Token Interceptor
//---------------

   .config(['$httpProvider', function ($httpProvider) {
       $httpProvider.interceptors.push('TokenInterceptor');
   }])

//---------------
// Routes
//---------------

	.config(['$stateProvider', '$urlRouterProvider', function ($stateProvider, $urlRouterProvider) {

		$stateProvider
			.state('anon.user.register', {
				url: '/register',
				templateUrl: 'partials/user.register.tpl.html',
				controller: 'UserAuthenticationController',
				data: {
		      title: 'Register'
				}
			})
			.state('anon.user.confirm', {
				url: '/confirm/:token',
				controller: 'UserConfirmEmailController',
				data: {
		      title: 'Confirm Email'
				}
			})
			.state('anon.user.login', {
				url: '/login',
				templateUrl: 'partials/user.login.tpl.html',
				controller: 'UserAuthenticationController',
				data: {
		      title: 'Login'
				}
			})
			.state('user.logout', {
				url: '/user/logout',
				views: {
					'main': {
						template: '<div class="loading-indicator overlay"><div class="loading-indicator-body"><div class="spinner"><double-bounce-spinner></double-bounce-spinner></div></div></div>',
					controller: 'UserLogoutController'
					}
				},
				data: {
		      title: 'Logout'
				}
			})
			.state('anon.forgot', {
				url: '/user/forgot',
				templateUrl: 'partials/user.forgot.tpl.html',
				controller: 'UserPasswordRenewalController',
				data: {
		      title: 'Forgot password'
				}
			})
			.state('anon.reset', {
				url: '/user/reset/:token',
				templateUrl: 'partials/user.reset.tpl.html',
				controller: 'UserPasswordRenewalController',
				data: {
		      title: 'Reset password'
				}
			})
			.state('user.settings', {
				url: '/user/settings',
				views: {
	    		'main': {
						templateUrl: 'partials/user.settings.view.tpl.html',
						controller: 'UserSettingsController'
					},
					'actionnavigation-xs@': {
		    		template: '<button type="button" class="navbar-toggle actionbutton" ui-sref="user.settings.edit"><i class="glyphicon glyphicon-pencil"></i></button>'
					}
				},
				data: {
					title: 'User settings'
				}
			})
			.state('user.settings.edit', {
				url: '/edit',
				views: {
	    		'main@user': {
						templateUrl: 'partials/user.settings.edit.tpl.html',
						controller: 'UserSettingsController'
					},
					'actionnavigation-xs@': {
		    		template: '<button type="button" class="navbar-toggle actionbutton" ng-click="updateUserSettings()"><i class="glyphicon glyphicon-floppy-disk"></i></button>',
						controller: 'UserSettingsController'
					}
				}
			})
    ;
  }])
;


