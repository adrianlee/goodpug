var app = angular.module('Pug', ['ngRoute']);
// config
app.config(function($routeProvider, $locationProvider, $httpProvider) {
    $routeProvider.when('/', {
        templateUrl: 'views/pugs.html',
        controller: 'pugsController',
        resolve: {
            pugs: function($q, apiFactory) {
                var delay = $q.defer();
                apiFactory.getPugs().success(function(data) {
                    var pugs = {};
                    for (var i = 0; i < data.length; i++) {
                        pugs[data[i].id] = data[i];
                    }
                    delay.resolve(pugs);
                }).error(function(err, status) {
                    delay.reject(status);
                });
                return delay.promise;
            },
            profile: function($q, apiFactory) {
                var delay = $q.defer();
                apiFactory.getProfile().success(function(profile) {
                    delay.resolve(profile);
                }).error(function(err, status) {
                    delay.reject(status);
                });
                return delay.promise;
            }
        }
    }).when('/login', {
        templateUrl: 'views/login.html',
        controller: 'loginController'
    }).when('/logout', {
        templateUrl: 'views/logout.html',
        controller: 'logoutController'
    }).when('/oops', {
        templateUrl: 'oops.html',
        controller: 'oopsController'
    }).when('/admin', {
        templateUrl: 'views/admin.html',
        controller: 'adminController',
        resolve: {
            profile: function($q, apiFactory) {
                var delay = $q.defer();
                apiFactory.getProfile().success(function(profile) {
                    delay.resolve(profile);
                }).error(function(err, status) {
                    delay.reject(status);
                });
                return delay.promise;
            }
        }
    }).when('/pug/:id', {
        templateUrl: 'views/lobby.html',
        controller: 'lobbyController',
        resolve: {
            pug: function($q, $route, apiFactory) {
                var delay = $q.defer();
                apiFactory.getPug($route.current.params && $route.current.params.id).success(function(pug) {
                    delay.resolve(pug);
                }).error(function(err, status) {
                    console.log(status);
                    delay.reject(err);
                });
                return delay.promise;
            }
        }
    }).when('/me', {
        templateUrl: 'views/profile.html',
        controller: 'profileController',
        resolve: {
            profile: function($q, apiFactory) {
                var delay = $q.defer();
                apiFactory.getProfile().success(function(profile) {
                    delay.resolve(profile);
                }).error(function(err, status) {
                    delay.reject(status);
                });
                return delay.promise;
            }
        }
    }).when('/pugs', {
        templateUrl: 'views/pugs.html',
        controller: 'pugsController',
        resolve: {
            pugs: function($q, apiFactory) {
                var delay = $q.defer();
                apiFactory.getPugs().success(function(data) {
                    var pugs = {};
                    for (var i = 0; i < data.length; i++) {
                        pugs[data[i].id] = data[i];
                    }
                    delay.resolve(pugs);
                }).error(function(err, status) {
                    delay.reject(status);
                });
                return delay.promise;
            },
            profile: function($q, apiFactory) {
                var delay = $q.defer();
                apiFactory.getProfile().success(function(profile) {
                    delay.resolve(profile);
                }).error(function(err, status) {
                    delay.reject(status);
                });
                return delay.promise;
            }
        }
    }).otherwise({
        redirectTo: '/'
    });
    $locationProvider.html5Mode(true);
    $httpProvider.defaults.useXDomain = true;
    delete $httpProvider.defaults.headers.common['X-Requested-With'];
});
// run
app.run(function($rootScope, $location, profileService, apiFactory) {
    // // register listener to watch route changes
    $rootScope.$on("$routeChangeStart", function(event, next, current) {
        // if (pugsFactory.connected) {
        //     pugsFactory.disconnect();
        // }
        // if (lobbyFactory.connected) {
        //     // lobbyFactory.leave();
        // }
    });
    $rootScope.$on("$routeChangeError", function(event, next, current, rejection) {
        console.log("routeChangeError");
        if (rejection == 401) {
            location.href = "/logout";
            return;
        };
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
app.controller('homeController', function() {});
app.controller('loginController', function() {});
app.controller('logoutController', function() {
    location.href = "/logout";
});
app.controller('oopsController', function() {});
app.controller('profileController', function($scope, profile) {
    $scope.profile = profile || {};
});
app.controller('adminController', function($scope, profile) {});
app.controller('pugsController', function($scope, $location, apiFactory, serviceFactory, pugs) {
    $scope.pugs = pugs || {};
    serviceFactory.lobbies = pugs;
    serviceFactory.browserJoin();
    $scope.$on("$destroy", function() {
        serviceFactory.browserLeave();
    });
    // scope functions
    $scope.join = function(pug) {
        $location.path("/pug/" + pug.id);
    };
    // observer
    var updatePugs = function() {
        // update pugs
        if (serviceFactory.lobbies) {
            $scope.pugs = serviceFactory.lobbies;
        }
        $scope.$apply();
    };
    serviceFactory.registerObserverCallback(updatePugs);
});
app.controller('lobbyController', function($scope, pug, serviceFactory, profileService) {
    $scope.pug = pug;
    serviceFactory.lobbyJoin(pug.id, profileService.profile);
    $scope.$on("$destroy", function() {
        serviceFactory.lobbyLeave();
    });
    $scope.join = function() {
        for (var i in $scope.pug.players) {
            if ($scope.pug.players[i] == profileService.profile.displayName) {
                return console.log("already joined");
            }
        }
        serviceFactory.lobbyJoin(pug.id, profileService.profile);
    };
    var updateLobby = function() {
        // update pug info if joined
        console.log(serviceFactory.currentLobby);
        if (serviceFactory.currentLobby) {
            $scope.pug = serviceFactory.currentLobby;
        }
        $scope.$apply();
    };
    serviceFactory.registerObserverCallback(updateLobby);
});
// factories
app.factory('serviceFactory', function(ENV) {
    // socket
    var socket = io.connect(ENV.serviceEndpoint + '/pugs', {
        reconnection: true
    });
    socket.on('connect', function() {});
    socket.on('browser update', function(pug) {
        console.log("browser updated", pug);
        if (service.lobbies[pug.id]) {
            service.lobbies[pug.id].players = pug.players;
            service.lobbies[pug.id].status = pug.status;
        }
        notifyObservers();
    });
    socket.on("lobby update", function(data) {
        console.log("lobby updated", data);
        service.currentLobby = data;
        notifyObservers();
    });
    // register observer for lobby changes
    var observerCallbacks = [];
    var notifyObservers = function() {
        angular.forEach(observerCallbacks, function(callback) {
            callback();
        });
    };
    // pugs
    var service = {};
    service.lobbies = {};
    service.currentLobby = null;
    service.lobbyJoin = function(pugId, profile) {
        // join
        console.log("lobby join", pugId);
        socket.emit("lobby join", {
            id: pugId,
            displayName: profile.displayName
        });
    };
    service.lobbyLeave = function() {
        // leave
        console.log("lobby leave", service.currentLobby);
        socket.emit("lobby leave");
        // set current lobby
        service.currentLobby = null;
    };
    service.browserJoin = function() {
        // join
        console.log("browser join");
        socket.emit("browser join");
    };
    service.browserLeave = function() {
        // leave
        console.log("browser leave");
        socket.emit("browser leave");
    };
    service.registerObserverCallback = function(callback) {
        observerCallbacks.push(callback);
    };
    return service;
});
// app.factory('lobbyFactory', function(ENV) {
//     // socket
//     var socket = io.connect(ENV.serviceEndpoint + '/lobby', {
//         reconnection: true
//     });
//     socket.on('connect', function() {});
//     socket.on("update", function(data) {
//         lobby.pug = data;
//         notifyObservers();
//     });
//     // lobby
//     var lobby = {};
//     lobby.pug = null;
//     lobby.join = function(pugId, profile) {
//         console.log("joining lobby", lobby.pug && lobby.pug.id);
//         // join
//         socket.emit("join", {
//             id: pugId,
//             displayName: profile.displayName
//         });
//     };
//     lobby.leave = function() {
//         console.log("leaving lobby", lobby.pug && lobby.pug.id);
//         // leave
//         socket.emit("leave");
//     };
//     lobby.ready = function() {
//         socket.emit("ready");
//     };
//     // register observer for lobby changes
//     var observerCallbacks = [];
//     var notifyObservers = function() {
//         angular.forEach(observerCallbacks, function(callback) {
//             callback();
//         });
//     };
//     lobby.registerObserverCallback = function(callback) {
//         observerCallbacks.push(callback);
//     };
//     return lobby;
// });
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
// filters
app.filter('getCount', function() {
    return function(items) {
        return items.length;
    }
});