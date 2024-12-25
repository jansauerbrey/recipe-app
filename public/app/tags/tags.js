angular.module('app.tags', ['ui.router'])

//---------------
// Services
//---------------


  .factory('Tags', ['$resource', 'BASE_URI', function($resource, BASE_URI){
    return $resource(BASE_URI+'api/tags/:id', null, {
      'update': { method:'PUT' }
    });
  }])


//---------------
// Controllers
//---------------


// Tags

  .controller('TagsController', ['$scope', 'tags', function ($scope, tags) {
    $scope.tags = tags;
  }])

  .controller('TagDetailCtrl', ['$scope', '$stateParams', 'tag', 'Tags', '$state', function ($scope, $stateParams, tag, Tags, $state) {
    $scope.tag = tag;

    $scope.update = function(){
      Tags.update({id: $scope.tag._id}, $scope.tag, function(){
        $state.go('admin.tags.list');
      });
    };

    $scope.remove = function(){
      Tags.remove({id: $scope.tag._id}, function(){
        $state.go('admin.tags.list');
      });
    };

    $scope.save = function(){
      if(!$scope.newtag || $scope.newtag.length < 1) return;
      const tag_new = new Tags({ text: $scope.newtag.text });

      tag_new.$save(function(){
        $state.go('admin.tags.list');
      });
    };

  }])



//---------------
// Routes
//---------------

  .config(['$stateProvider', '$urlRouterProvider', function ($stateProvider, $urlRouterProvider) {

    $stateProvider	
      .state('admin.tags', {
        abstract: true,
        url: '/tags',
        template: '<ui-view />',
        data: {
          title: 'Tags'
        }
      })
      .state('admin.tags.list', {
        url: '/list',
        		templateUrl: 'partials/tags.tpl.html',
        		controller: 'TagsController',
        resolve: {
          tags: ['Tags', function(Tags){
            return Tags.query().$promise;
          }]
        },
        data: {
        			name: 'Tags',
        			icon: 'glyphicon glyphicon-tags'
        }
      		})
      		.state('admin.tags.edit', {
        url: '/edit/:id',
        		templateUrl: 'partials/tags.details.tpl.html',
        		controller: 'TagDetailCtrl',
        resolve: {
          tag: ['Tags', '$stateParams', function(Tags, $stateParams){
            const tag = Tags.get({'id': $stateParams.id}, function(response) {
              return response;
            }).$promise;
            return tag;
          }]
        }
     		})
      		.state('admin.tags.add', {
        url: '/add',
        		templateUrl: 'partials/tags.add.tpl.html',
        		controller: 'TagDetailCtrl',
        resolve: {
          tag: ['Tags', function(Tags){
            const tag = new Tags();
            return tag;
          }]
        }
      		})
    ;
  }])
;


