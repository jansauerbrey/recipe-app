'use strict';

angular.module('recipeApp', [
  'ngRoute',
  'ngCookies',
  'recipeApp.recipes',
  'recipeApp.ingredients',
  'recipeApp.units',
  'recipeApp.tags',
  'recipeApp.dishtypes',
  'recipeApp.schedules',
  'recipeApp.admin'
])
  .config(['$routeProvider', '$locationProvider', function($routeProvider, $locationProvider) {
    $routeProvider
      .when('/', {
        templateUrl: 'partials/home.tpl.html',
        controller: 'HomeCtrl'
      })
      .when('/login', {
        templateUrl: 'partials/user.login.tpl.html',
        controller: 'LoginCtrl'
      })
      .when('/register', {
        templateUrl: 'partials/user.register.tpl.html',
        controller: 'RegisterCtrl'
      })
      .when('/forgot-password', {
        templateUrl: 'partials/user.forgot.tpl.html',
        controller: 'ForgotPasswordCtrl'
      })
      .when('/reset-password/:token', {
        templateUrl: 'partials/user.reset.tpl.html',
        controller: 'ResetPasswordCtrl'
      })
      .when('/settings', {
        templateUrl: 'partials/user.settings.view.tpl.html',
        controller: 'SettingsCtrl'
      })
      .otherwise({ redirectTo: '/' });

    $locationProvider.html5Mode(true);
  }])
  .run(['$rootScope', '$location', 'authService', function($rootScope, $location, authService) {
    $rootScope.$on('$routeChangeStart', function(event, next) {
      if (next.requiresAuth && !authService.isAuthenticated()) {
        event.preventDefault();
        $location.path('/login');
      }
    });
  }])
  .factory('authService', ['$http', '$cookies', function($http, $cookies) {
    const service = {
      isAuthenticated: function() {
        return !!$cookies.get('token');
      },
      login: function(credentials) {
        return $http.post('/api/auth/login', credentials)
          .then(function(response) {
            $cookies.put('token', response.data.token);
            return response;
          });
      },
      logout: function() {
        $cookies.remove('token');
      },
      register: function(userData) {
        return $http.post('/api/auth/register', userData);
      },
      forgotPassword: function(email) {
        return $http.post('/api/auth/forgot-password', { email });
      },
      resetPassword: function(token, password) {
        return $http.post('/api/auth/reset-password', { token, password });
      }
    };
    return service;
  }])
  .factory('alertService', ['$rootScope', '$timeout', function($rootScope, $timeout) {
    const alerts = [];
    const service = {
      add: function(type, text, timeout = 5000) {
        const alert = { type, text };
        alerts.push(alert);
        if (timeout) {
          $timeout(function() {
            const index = alerts.indexOf(alert);
            if (index !== -1) {
              alerts.splice(index, 1);
            }
          }, timeout);
        }
      },
      success: function(text) {
        this.add('success', text);
      },
      error: function(text) {
        this.add('error', text);
      },
      warning: function(text) {
        this.add('warning', text);
      },
      info: function(text) {
        this.add('info', text);
      },
      clear: function() {
        alerts.length = 0;
      },
      getAlerts: function() {
        return alerts;
      }
    };
    return service;
  }])
  .controller('HomeCtrl', ['$scope', '$http', 'alertService',
    function($scope, $http, alertService) {
      $scope.loading = true;
      $scope.error = null;

      $http.get('/api/recipes/recent')
        .then(function(response) {
          $scope.recentRecipes = response.data;
          $scope.loading = false;
        })
        .catch(function(error) {
          $scope.error = error.data?.error || 'Failed to load recent recipes';
          $scope.loading = false;
          alertService.error($scope.error);
        });
    }
  ])
  .controller('LoginCtrl', ['$scope', '$location', 'authService', 'alertService',
    function($scope, $location, authService, alertService) {
      $scope.credentials = {};
      $scope.loading = false;
      $scope.error = null;

      $scope.login = function() {
        if (!$scope.credentials.username || !$scope.credentials.password) {
          alertService.error('Please enter both username and password');
          return;
        }

        $scope.loading = true;
        authService.login($scope.credentials)
          .then(function() {
            $location.path('/');
          })
          .catch(function(error) {
            $scope.error = error.data?.error || 'Login failed';
            alertService.error($scope.error);
          })
          .finally(function() {
            $scope.loading = false;
          });
      };
    }
  ])
  .controller('RegisterCtrl', ['$scope', '$location', 'authService', 'alertService',
    function($scope, $location, authService, alertService) {
      $scope.user = {};
      $scope.loading = false;
      $scope.error = null;

      $scope.register = function() {
        if (!$scope.user.username || !$scope.user.password || !$scope.user.email) {
          alertService.error('Please fill in all required fields');
          return;
        }

        $scope.loading = true;
        authService.register($scope.user)
          .then(function() {
            alertService.success('Registration successful. Please log in.');
            $location.path('/login');
          })
          .catch(function(error) {
            $scope.error = error.data?.error || 'Registration failed';
            alertService.error($scope.error);
          })
          .finally(function() {
            $scope.loading = false;
          });
      };
    }
  ])
  .controller('ForgotPasswordCtrl', ['$scope', 'authService', 'alertService',
    function($scope, authService, alertService) {
      $scope.email = '';
      $scope.loading = false;
      $scope.error = null;
      $scope.success = false;

      $scope.sendResetLink = function() {
        if (!$scope.email) {
          alertService.error('Please enter your email address');
          return;
        }

        $scope.loading = true;
        authService.forgotPassword($scope.email)
          .then(function() {
            $scope.success = true;
            alertService.success('Password reset link has been sent to your email');
          })
          .catch(function(error) {
            $scope.error = error.data?.error || 'Failed to send reset link';
            alertService.error($scope.error);
          })
          .finally(function() {
            $scope.loading = false;
          });
      };
    }
  ])
  .controller('ResetPasswordCtrl', ['$scope', '$routeParams', '$location', 'authService', 'alertService',
    function($scope, $routeParams, $location, authService, alertService) {
      $scope.password = '';
      $scope.confirmPassword = '';
      $scope.loading = false;
      $scope.error = null;

      $scope.resetPassword = function() {
        if (!$scope.password || !$scope.confirmPassword) {
          alertService.error('Please enter and confirm your new password');
          return;
        }

        if ($scope.password !== $scope.confirmPassword) {
          alertService.error('Passwords do not match');
          return;
        }

        $scope.loading = true;
        authService.resetPassword($routeParams.token, $scope.password)
          .then(function() {
            alertService.success('Password has been reset. Please log in with your new password.');
            $location.path('/login');
          })
          .catch(function(error) {
            $scope.error = error.data?.error || 'Failed to reset password';
            alertService.error($scope.error);
          })
          .finally(function() {
            $scope.loading = false;
          });
      };
    }
  ])
  .controller('SettingsCtrl', ['$scope', '$http', 'alertService',
    function($scope, $http, alertService) {
      $scope.settings = {};
      $scope.loading = true;
      $scope.error = null;

      $http.get('/api/user/settings')
        .then(function(response) {
          $scope.settings = response.data;
          $scope.loading = false;
        })
        .catch(function(error) {
          $scope.error = error.data?.error || 'Failed to load settings';
          $scope.loading = false;
          alertService.error($scope.error);
        });

      $scope.saveSettings = function() {
        $scope.loading = true;
        $http.put('/api/user/settings', $scope.settings)
          .then(function() {
            alertService.success('Settings saved successfully');
          })
          .catch(function(error) {
            $scope.error = error.data?.error || 'Failed to save settings';
            alertService.error($scope.error);
          })
          .finally(function() {
            $scope.loading = false;
          });
      };
    }
  ]);
