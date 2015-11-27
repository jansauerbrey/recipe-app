angular.module('app', ['app.auth', 'app.recipes', 'app.schedules', 'app.frequentshopitems', 'app.shopitems', 'app.cooking', 'app.units', 'app.ingredients', 'app.dishtypes', 'app.admin', 'ui.router', 'ngAnimate', 'ngResource', 'ngStorage', 'ui.bootstrap', 'ui.checkbox', 'ngTagsInput', 'angular.filter', 'ngAside', 'anim-in-out'])

//---------------
// Constants
//---------------


//    .constant('BASE_URI', '/')
    .constant('BASE_URI', 'http://rezept-planer.de/')


//---------------
// Services
//---------------


// Navigation

    .factory('navigationMenu', function($state) {
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
            states: states
        };
    })


// File Upload

	.factory('httpPostFactory', [ '$http', 'BASE_URI', function ($http, BASE_URI) {
	    return function (file, data, callback) {
	        $http({
	            url: BASE_URI+file,
	            method: "POST",
	            data: data,
	            headers: {'Content-Type': undefined}
	        }).success(function (response) {
	            callback(response);
	        });
	    };
	}])


	.factory('isCordova', function () {
		var app = document.URL.indexOf( 'http://' ) === -1 && document.URL.indexOf( 'https://' ) === -1;
		if ( app ) {
			return true; // PhoneGap application
		} else {
			return false; // Web page
		}
	})


//---------------
// Controllers
//---------------

// Sidebar

    .controller('NavSidebarController', ['$scope', '$modalInstance', function ($scope, $modalInstance) {
     
      $scope.cancel = function(){
        $modalInstance.dismiss('cancel');
      }

    }])


//---------------
// Directives
//---------------

    .directive('navigation', ['$aside', 'navigationMenu', 'UserService', 'AuthorisationService', function ($aside, navigationMenu, UserService, AuthorisationService) {
      return {
        restrict: "E",
        replace: true,
        templateUrl: "partials/navigation-directive.tpl.html",
        controller:  function ($scope) {
          $scope.hideMobileNav = true;
          $scope.user = UserService.getCurrentLoginUser();
          $scope.states = navigationMenu.states;

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
    
    
	.directive('ngImageUpload', function (httpPostFactory) {
	    return {
	        restrict: 'A',
	        scope: true,
	        link: function (scope, element, attr) {
	
	            element.bind('change', function () {
	                var formData = new FormData();
	                formData.append('file', element[0].files[0]);
	                httpPostFactory('api/upload', formData, function (callback) {
	                    console.log(callback);
	                    scope.recipe.imagePath = callback;
	                });
	            });
	
	        }
	    };
	})

	.directive('cameraButton', function(httpPostFactory) {
	   return {
	      restrict: 'A',
	      scope: true,
	      link: function(scope, element, attrs) {
		 element.bind('click', function() {
		    navigator.camera.getPicture(function (imageURI) {
				window.resolveLocalFileSystemURL(imageURI, function(fileEntry) {
         				fileEntry.file(function(file) {
             					var reader = new FileReader();
                				reader.onloadend = function(e) {
                      					var imgBlob = new Blob([ e.target.result ], { type: file.type } );
					    		var formData = new FormData();
				            		formData.append('file', imgBlob, "file.jpg");
				               		httpPostFactory('api/upload', formData, function (callback) {
				                    		scope.recipe.imagePath = callback;
				               		});
						};
                 				reader.readAsArrayBuffer(file);
         				}, function(err){});
    				}, function(err){});
		    	}, function (err) {},
		    	{ quality: 50, destinationType: Camera.DestinationType.FILE_URI }
		    );
		 });
	      }
	   };
	})
		
//---------------
// Routes
//---------------

  .config(['$stateProvider', '$urlRouterProvider', function ($stateProvider, $urlRouterProvider) {

    $urlRouterProvider.otherwise('/');

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
			templateUrl: 'partials/startpage.tpl.html'
		})
		.state('anon.user', {
			url: '/user',
			abstract: true,
			template: "<ui-view />",
		})
		.state('user', {
			abstract: true,
			template: '<ui-view  class="anim-in-out anim-fade" data-anim-speed="1500"/>',
			data: {
				requiresLogin: true,
                 		requiredPermissions: ['User']
			}
		})
      		.state('impressum', {
			url: '/impressum',
        		templateUrl: 'partials/impressum.tpl.html',
			data: {
	        		name: 'Impressum',
        			icon: 'glyphicon glyphicon-info-sign'
			}
      		})
      		.state('accessdenied', {
			url: '/access/denied',
        		templateUrl: 'partials/access.denied.tpl.html'
      		})
      		.state('user.home', {
			url: '/home',
        		templateUrl: 'partials/home.tpl.html'
      		})

    ;
  }])

    .run(['$rootScope', '$state', '$stateParams', '$http', 'UserService', 'BASE_URI', function($rootScope, $state, $stateParams, $http, UserService, BASE_URI) {
	$rootScope.$state = $state;
	$rootScope.$stateParams = $stateParams;

	$rootScope.$on("$stateChangeStart", function(event, toState, toStateParams, fromState, fromStateParams) {
            $rootScope.previousState = fromState;
            $rootScope.previousStateParams = fromStateParams;
            var authorised;
            if (UserService.getCurrentLoginUser() !== undefined) {
		$http.get(BASE_URI+'api/user/check');
		if (toState.name == 'anon.startpage') {
			event.preventDefault(); 
			$state.go('user.home');
		};
	    };
        });
    }])

;


