angular.module('app.auth', ['ui.router'])

.factory('AuthenticationService', ['$http', '$localStorage', '$state', '$stateParams', '$rootScope', 'UserService', 'BASE_URI', 'AlertService',
function($http, $localStorage, $state, $stateParams, $rootScope, UserService, BASE_URI, AlertService) {
    
    var register = function(userData) {
        $http.post(BASE_URI + 'api/user/register', userData)
            .success(function() {
                AlertService.add('success', 'Account created successfully. You can now log in.');
                $state.go('anon.user.login');
            })
            .error(function(error) {
                if (error && error.error) {
                    AlertService.add('danger', error.error);
                } else {
                    AlertService.add('danger', 'Registration failed. Please try again.');
                }
            });
    };

    // ... rest of the service implementation ...

    return {
        register: register,
        // ... other methods ...
    };
}])

// ... rest of the module implementation ...
