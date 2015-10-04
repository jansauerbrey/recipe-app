angular.module('app', ['app.recipes', 'app.schedules', 'app.shopitems', 'app.cooking', 'app.units', 'app.ingredients', 'ui.router', 'ngResource', 'ngStorage', 'ui.bootstrap', 'ui.checkbox', 'ngTagsInput', 'ngAside'])

//---------------
// Constants
//---------------


//    .constant('BASE_URI', '/')
    .constant('BASE_URI', 'http://rezept-planer.de/')


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

// Navigation

    .factory('routeNavigation', function($state) {
	var states = [];        
	var stateslist = $state.get();
        angular.forEach(stateslist, function (state) {
            if (state.data && state.data.name) {
                states.push({
                    path: state.url,
		    name: state.name,
                    label: state.data.name,
                    icon: state.data.icon ? state.data.icon : null,
                    panelright: state.data.panelright ? state.data.panelright : false,
                    requiresLogin: state.data.requiresLogin ? state.data.requiresLogin : false,
                    requiredPermissions: state.data.requiredPermissions ? state.data.requiredPermissions.join() : undefined
                });
            }
        });

        return {
            states: states,
            activeState: function (state) {
                return $state.is(state.name);
            }
        };
    })

        .factory('User', ['$resource', 'BASE_URI', function($resource, BASE_URI){
          return $resource(BASE_URI+'api/user/info/:id');
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
	        $state.go("anon.login");
	    });
	}
    }])



    .controller('UserLogout', ['$scope', '$state', '$localStorage', 'AuthenticationService',
        function UserLogout($scope, $state, $localStorage, AuthenticationService) {
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
          $scope.routes = routeNavigation.states;
          $scope.activeRoute = routeNavigation.activeState;

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

  .config(['$stateProvider', '$urlRouterProvider', function ($stateProvider, $urlRouterProvider) {

    $urlRouterProvider.otherwise('anon.startpage');

    $stateProvider
		.state('anon', {
			abstract: true,
			template: "<ui-view />",
			data	: {
				requiresLogin: false,
                 		requiredPermissions: ['NoUser']
			}
		})
		.state('anon.startpage', {
			url: '/',
			templateUrl: 'partials/startpage.tpl.html',
			controller: 'StartpageController'
		})
		.state('anon.user', {
			url: '/user',
			abstract: true,
			template: "<ui-view />",
		})
		.state('anon.user.register', {
			url: '/register',
        		templateUrl: 'partials/user.register.tpl.html',
        		controller: 'UserCtrl',
			data: {
	        		name: 'Register',
        			icon: 'glyphicon glyphicon-edit',
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
				panelright: true
			}
      		})
      		.state('accessdenied', {
			url: '/access/denied',
        		templateUrl: 'partials/access.denied.tpl.html'
      		})

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
		.state('user', {
			abstract: true,
			template: "<ui-view />",
			data: {
				requiresLogin: true,
                 		requiredPermissions: ['User']
			}
		})
      		.state('user.home', {
			url: '/home',
        		templateUrl: 'partials/home.tpl.html',
        		controller: 'HomeController'
      		})
      		.state('user.logout', {
			url: '/user/logout',
        		templateUrl: 'partials/user.logout.tpl.html',
        		controller: 'UserLogout',
			data: {
				name: 'Logout',
				icon: 'glyphicon glyphicon-log-out',
				panelright: true
			}
      		})
      		.state('impressum', {
			url: '/impressum',
        		templateUrl: 'partials/impressum.tpl.html',
        		controller: 'ImpressumController',
			data: {
	        		name: 'Impressum',
        			icon: 'glyphicon glyphicon-info-sign'
			}
      		})

    ;
  }])

    .run(['$rootScope', '$state', '$localStorage', '$http', 'AuthorisationService', 'UserService', 'BASE_URI', function($rootScope, $state, $localStorage, $http, AuthorisationService, UserService, BASE_URI) {
        $rootScope.$on("$stateChangeStart", function(event, toState, toStateParams, fromState, fromStateParams) {
            var authorised;
            if (UserService.getCurrentLoginUser() !== undefined) $http.get(BASE_URI+'api/user/check');
            /*if (fromState.name === "anon.user.login" && toState.name !== "anon.user.login") {
		loginRedirectUrl = loginRedirectUrl ? loginRedirectUrl : "user.home";
                //$state.go(loginRedirectUrl, {}, {location: replace});
            } /*else if (toState.data !== undefined) {
                authorised = AuthorisationService.authorize(toState.data.requiresLogin,
                                                     toState.data.requiredPermissions);
                if (authorised === 1) {
                    //routeChangeRequiredAfterLogin = true;
                    loginRedirectUrl = (toState.name !== "anon.user.login") ? toState.name : "user.home" ;
                    $state.go("anon.user.login");
                } else if (authorised === 2) {
                    $state.go("accessdenied", {location: replace});
                }
            } else {
		$state.go("anon.startpage");
	    }*/
        });
    }])

;


