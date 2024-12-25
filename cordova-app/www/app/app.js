angular.module('app', ['app.auth', 'app.recipes', 'app.schedules', 'app.shopitems', 'app.units', 'app.ingredients', 'app.tags', 'app.dishtypes', 'app.admin', 'app.alert', 'ui.router', 'ngAnimate', 'ngResource', 'ngStorage', 'ui.bootstrap', 'ngTagsInput', 'angular.filter', 'ngAside', 'angular-spinkit', 'gm.datepickerMultiSelect', '720kb.socialshare', 'as.sortable'])

//---------------
// Constants
//---------------


//    .constant('BASE_URI', '/')
    .constant('BASE_URI', 'https://www.rezept-planer.de/')


//---------------
// Services
//---------------


// Navigation

    .factory('navigationMenu', ['$state', function($state) {
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
    }])


    .factory('navigationTitle', ['$state', function($state) {
      var data = {title: ''};
      return {
      	getObject: function() {
          return data;
        }
      };
    }])


    .factory('subdomain', ['$location', function ($location) {
      var host = $location.host();
      if (host.indexOf('.') < 0) 
        return null;
      else
        return host.split('.')[0];
    }])


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


// Navbar


    .controller('NavbarController', ['$scope', 'navigationTitle', 'subdomain', function ($scope, navigationTitle, subdomain) {
      $scope.navObject = navigationTitle.getObject();
      $scope.showBeta = subdomain == "beta" ? true : false;
    }])
    

// Sidebar

    .controller('NavSidebarController', ['$scope', '$uibModalInstance', function ($scope, $uibModalInstance) {
     
      $scope.cancel = function(){
        $uibModalInstance.dismiss('cancel');
      }

    }])
    
    .controller('StartpageController', ['$scope', function ($scope) {
     
      $scope.openLink = function(link){
        window.open(link);
      }

    }])
    

//---------------
// Directives
//---------------

    .directive('navsidebar', ['$aside', 'UserService', function ($aside, UserService) {
      return {
        restrict: "E",
        replace: true,
        templateUrl: "partials/navigation.sidebar.button.tpl.html",
        controller: [ '$scope', '$state', function($scope, $state) {
          //$scope.hideMobileNav = true;
          $scope.showBackNav = function() {
          	return ($state.includes('user.recipes') && $state.$current.path.length>2);
          }
          $scope.onClick = function() {
          	if (this.showBackNav()) {
              to = $state.$current;
              do{
                to = to.parent;
              }while(to.abstract)
              return $state.transitionTo(to, {}, { inherit: true, relative: $state.$current });
          	} else{
      $aside.open({
                templateUrl: 'partials/navigation.sidebar.tpl.html',
                controller: 'NavSidebarController',
                placement: 'left',
                size: 'lg'
              });
          	}
          }
      	}]
      };
    }])
    

    .directive('access', [ '$rootScope', 'UserService', function ($rootScope, UserService) {
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

                          result = UserService.authorize(undefined, roles);
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
                  $rootScope.$on('$stateChangeSuccess', function() {
                    if (roles.length > 0) {
                        determineVisibility(true);
                    }
                  });
              }
            };
        }])


    .directive('ngReallyClick', ['$uibModal', function($uibModal) {
    return {
        restrict: 'A',
        scope: {
          ngReallyClick:"&"
        },
        link: function(scope, element, attrs) {
            element.bind('click', function() {
            		if (scope.$parent.schedule && scope.$parent.schedule.recipe && scope.$parent.schedule.recipe.name){
            			//var recipeName = scope.$parent.schedule.recipe.name;
                  var message =  "Are you sure to delete the recipe "+scope.$parent.schedule.recipe.name+" from schedule?";
            		} else if (scope.$parent.recipe && scope.$parent.recipe.name){
            			//var recipeName = scope.$parent.recipe.name;
                	var message =  "Are you sure to delete the recipe "+scope.$parent.recipe.name+"?";
            		} else {
            			var message =  attrs.ngReallyMessage || "Are you sure?";
            		}
            		
                
                var modalNgReally = $uibModal.open({
                  animation: true,
                  templateUrl: 'partials/ngreally.tpl.html',
                  controller: ['$scope', '$uibModalInstance', 'message', function ($scope, $uibModalInstance, message) {
      							$scope.message = message;
      							$scope.ok = function(){
                      $uibModalInstance.close();
                    }
                    
                    $scope.cancel = function(){
                      $uibModalInstance.dismiss('cancel');
                    }
                  }],
                  size: 'xs',
                  resolve: {
                      message: function(){
                        return message;
                      }
                  }
                });
        
                modalNgReally.result.then(function(){
                  scope.ngReallyClick();
                });
            });
        }
    }
    }])
    
    
  .directive('ngImageUpload', ['httpPostFactory', function (httpPostFactory) {
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
  }])

  .directive('cameraButton', ['httpPostFactory', function(httpPostFactory) {
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
  }])

  .directive('stateLoadingIndicator', ['$rootScope', function($rootScope) {
    return {
      restrict: 'E',
      template: "<div ng-show='isStateLoading' class='loading-indicator overlay'>" +
      "<div class='loading-indicator-body'>" +
      "<div class='spinner'><double-bounce-spinner></double-bounce-spinner></div>" +
      "</div>" +
      "</div>",
      replace: true,
      link: function(scope, elem, attrs) {
        scope.isStateLoading = false;
   			
        $rootScope.$on('$stateChangeStart', function() {
          scope.isStateLoading = true;
        });
        $rootScope.$on('$stateChangeSuccess', function() {
          scope.isStateLoading = false;
        });
      }
    };
  }])
  
  
  
    
//---------------
// Filter
//---------------
  
  
  .filter('timeFilter', function() {

    var conversions = {
      'ss': angular.identity,
      'mm': function(value) { return value * 60; },
      'hh': function(value) { return value * 3600; }
    };

    return function(value, unit) {
      var totalSeconds = conversions[unit || 'ss'](value),
          hh = Math.floor(totalSeconds / 3600),
          mm = Math.floor((totalSeconds % 3600) / 60);

      hh = (hh > 0)? hh: '';
      format = (hh == '')? 'mm min' : 'hhh mmm';
      return format.replace(/hh/, hh).replace(/mm/, mm);
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
      views: {'root':
        {template: "<ui-view />"}
      },
      data	: {
        requiresLogin: false,
                 		requiredPermissions: ['NoUser']
      }
    })
    .state('anon.startpage', {
      url: '/',
      templateUrl: 'partials/startpage.tpl.html',
      controller: 'StartpageController',
      data: {
        title: 'rezept-planer.de'
      }
    })
    .state('anon.user', {
      url: '/user',
      abstract: true,
      template: "<ui-view />",
    })
    .state('user', {
      abstract: true,
      views: {'root':
        {template: '<div ui-view="main"></div>'}
      },
      data: {
        requiresLogin: true,
                 		requiredPermissions: ['User']
      }
    })
    .state('impressum', {
      url: '/impressum',
      views: {'root':
        { templateUrl: 'partials/impressum.tpl.html'}
      },
      data: {
        title: 'Impressum'
      }
    })
    .state('accessdenied', {
      url: '/access/denied',
      views: {'root':
        { templateUrl: 'partials/access.denied.tpl.html'}
      }
    })
    .state('user.home', {
      url: '/home',
      views: {'main':
        {templateUrl: 'partials/home.tpl.html'}
      },
      data: {
        title: 'Home'
      }
    })
    ;
  }])

    .run(['$rootScope', '$state', '$stateParams', '$http', 'UserService', 'navigationTitle', 'BASE_URI',
  function($rootScope, $state, $stateParams, $http, UserService, navigationTitle, BASE_URI) {
      $rootScope.$state = $state;
      $rootScope.$stateParams = $stateParams;
      $rootScope.print = function(print){
      	window.print();
      };
    
      $rootScope.$on('$stateChangeStart', function(event, toState, toStateParams, fromState, fromStateParams) {
        $rootScope.previousState = fromState ? fromState : {};
        $rootScope.previousState.name = fromState.name ? fromState.name : 'user.home';
        $rootScope.previousStateParams = fromStateParams ? fromStateParams : {};
        //var authorised;
        var authenticated = UserService.isAuthenticated();
        if (authenticated === true) {
          $http.get(BASE_URI+'api/user/check');
          if (toState.name == 'anon.startpage') {
            event.preventDefault(); 
            $state.go('user.home');
          };	
        };
        if (toState.data && toState.data.title) {
        	var obj = navigationTitle.getObject();
        	obj.title = toState.data.title;
        };
     	});
     	
     	$rootScope.$on('$stateChangeSuccess', function() {
   			document.body.scrollTop = document.documentElement.scrollTop = 0;
      });
    }])

;
