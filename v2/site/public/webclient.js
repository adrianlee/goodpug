var app = angular.module('Pug', ['ngRoute']);
// config
app.config(function($routeProvider, $locationProvider, $httpProvider) {
    $routeProvider.when('/', {
        templateUrl: 'views/home.html',
        controller: 'homeController'
    }).when('/login', {
        templateUrl: 'views/login.html',
        controller: 'homeController'
    });
    //$locationProvider.html5Mode(true);
    // $httpProvider.defaults.useXDomain = true;
    // delete $httpProvider.defaults.headers.common['X-Requested-With'];
});
// run
app.run(function($rootScope, $location, profileService) {
    // register listener to watch route changes
    $rootScope.$on("$routeChangeStart", function(event, next, current) {
        if (!profileService.loggedIn) {
            if (next.templateUrl !== "views/login.html") {
                $location.path("/login");
            }
        }
    });
});
// controllers
app.controller('mainController', function($scope, apiFactory, profileService) {
    apiFactory.getProfile().success(function(data) {
        profileService.profile = data;
        profileService.loggedIn = true;
    });
});
app.controller('homeController', function($scope, apiFactory) {});
// factories
app.factory('apiFactory', function($http) {
    var profile = {};
    profile.getProfile = function() {
        return $http.get('/profile');
    };
    return profile;
});
// services
app.service('profileService', function() {
    this.loggedIn = false;
    this.profile = {};
});