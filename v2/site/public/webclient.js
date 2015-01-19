var app = angular.module('Pug', ['ngRoute']);
// config
app.config(function($routeProvider, $locationProvider, $httpProvider) {
    var resolve = {
        delay: function($q) {
            var delay = $q.defer();
            setTimeout(delay.resolve, 1000);
            return delay.promise;
        }
    };
    $routeProvider.when('/', {
        templateUrl: 'views/home.html',
        controller: 'homeController'
    }).when('/login', {
        templateUrl: 'views/login.html',
        controller: 'loginController'
    }).when('/oops', {
        templateUrl: 'views/oops.html',
        controller: 'oopsController'
    }).when('/pug/:id', {
        templateUrl: 'views/lobby.html',
        controller: 'pugLobbyController',
        resolve: {
            pug: function($q, $route, apiFactory) {
                var delay = $q.defer();
                apiFactory.getPug($route.current.params && $route.current.params.id).success(function(pug) {
                    delay.resolve(pug);
                }).error(function() {
                    delay.reject();
                });
                return delay.promise;
            }
        }
    }).when('/me', {
        templateUrl: 'views/profile.html',
        controller: 'profileController',
        resolve: {
            profile: function($q, apiFactory, $location) {
                var delay = $q.defer();
                apiFactory.getProfile().success(function(profile) {
                    delay.resolve(profile);
                }).error(function() {
                    delay.reject();
                });
                return delay.promise;
            }
        }
    }).when('/pugs', {
        templateUrl: 'views/pugs.html',
        controller: 'pugsController'
    }).otherwise({
        redirectTo: '/'
    });
    $locationProvider.html5Mode(true);
    $httpProvider.defaults.useXDomain = true;
    delete $httpProvider.defaults.headers.common['X-Requested-With'];
});
// run
app.run(function($rootScope, $location, profileService, apiFactory, pugsFactory, lobbyFactory) {
    // // register listener to watch route changes
    $rootScope.$on("$routeChangeStart", function(event, next, current) {
        // var originalPath = next.originalPath;
        // if (!profileService.loggedIn) {
        //     // if (next.templateUrl !== "views/login.html") {
        //     //     $location.path("/login");
        //     // }
        //     apiFactory.getProfile().success(function(data) {
        //         profileService.profile = data;
        //         profileService.loggedIn = true;
        //         if (data) {
        //             $location.path(originalPath);
        //         }
        //     });
        //     event.preventDefault();
        // }
        if (pugsFactory.connected) {
            pugsFactory.disconnect();
        }

        if (lobbyFactory.connected) {
            lobbyFactory.disconnect();
        }
    });

    $rootScope.$on("$routeChangeError", function(event, next, current) {
        console.log("routeChangeError");
        event.preventDefault();
        $location.path("/oops");
    });
});
// controllers
app.controller('mainController', function($scope, apiFactory, profileService) {
    $scope.loginBlock = true;
    $scope.$watch('profileService.loggedIn', function() {
        $scope.loginBlock = false;
    });
    apiFactory.getProfile().success(function(data) {
        profileService.profile = data;
        profileService.loggedIn = true;
        if (!data) profileService.forceLogin()
    });
});
app.controller('homeController', function($scope) {});
app.controller('loginController', function($scope) {});
app.controller('oopsController', function($scope) {});
app.controller('profileController', function($scope, profile) {
    $scope.profile = profile || {};
});
app.controller('pugsController', function($scope, $location, apiFactory, pugsFactory) {
    $scope.pugs = {};
    apiFactory.getPugs().success(function(data) {
        $scope.pugs = data;
    });
    if (!pugsFactory.connected) {
        pugsFactory.connect();
    } else {
        console.log("pugsFactory.connected", pugsFactory.connected)
    }
    $scope.join = function(pug) {
        console.log("pug lobby clicked");
        $location.path("/pug/" + pug.id);
    };
    // var socket = io.connect('http://localhost:4000');
    // socket.on('news', function (data) {
    //     console.log(data);
    //     socket.emit('my other event', { my: 'data' });
    // });
});
app.controller('pugLobbyController', function($scope, $routeParams, pug, lobbyFactory) {
    $scope.pug = pug;
    if (!lobbyFactory.connected) {
        lobbyFactory.connect();
    }
});
// factories
app.factory('apiFactory', function($http, ENV) {
    var profile = {};
    profile.getProfile = function() {
        return $http.get('/profile');
    };
    profile.getPugs = function() {
        return $http.get(ENV.serviceEndpoint + '/pugs');
    };
    profile.getPug = function(id) {
        return $http.get(ENV.serviceEndpoint + '/pug/' + id);
    };
    return profile;
});
app.factory('pugsFactory', function(ENV) {
    var pugs = {};
    var socket;
    pugs.connected = false;
    pugs.connect = function() {
        if (socket) {
            return socket.connect();
        }
        socket = io.connect(ENV.serviceEndpoint + '/pugs', {
            reconnection: true
        });
        socket.on('connect', function() {
            pugs.connected = true;
        });
        socket.on('news', function(data) {
            console.log(data);
            socket.emit('my other event', {
                my: 'data'
            });
        });
    }
    pugs.disconnect = function() {
        socket.disconnect();
        pugs.connected = false;
    }
    return pugs;
});
app.factory('lobbyFactory', function(ENV) {
    var lobby = {};
    var socket;
    lobby.connected = false;
    lobby.connect = function() {
        if (socket) {
            return socket.connect();
        }
        socket = io.connect(ENV.serviceEndpoint + '/lobby', {
            reconnection: true
        });
        socket.on('connect', function() {
            lobby.connected = true;
        });
        socket.on('news', function(data) {
            console.log(data);
            socket.emit('my other event', {
                my: 'data'
            });
        });
    }
    lobby.disconnect = function() {
        socket.disconnect();
        lobby.connected = false;
    }
    return lobby;
});
// services
app.service('profileService', function() {
    this.loggedIn = false;
    this.profile = {};
    this.forceLogin = function() {
        location.reload();
    };
});
// constants
app.constant('ENV', {
  'serviceEndpoint': 'http://localhost:4000'
});