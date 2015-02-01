var app = angular.module('Pug', ['ngRoute']);
// config
app.config(function($routeProvider, $locationProvider, $httpProvider) {
    $routeProvider.when('/', {
        templateUrl: '/views/home.html',
        controller: 'homeController',
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
            }
        }
    }).when('/login', {
        templateUrl: '/views/login.html',
        controller: 'loginController'
    }).when('/oops', {
        templateUrl: 'oops.html',
        controller: 'oopsController'
    }).when('/403', {
        templateUrl: '403.html',
        controller: 'oopsController'
    }).when('/admin', {
        templateUrl: '/views/admin.html',
        controller: 'adminController',
        resolve: {
            playersAndServers: function($q, apiFactory) {
                var delay = $q.defer();
                apiFactory.getPlayersAndServers().success(function(profile) {
                    delay.resolve(profile);
                }).error(function(err, status) {
                    delay.reject(status);
                });
                return delay.promise;
            }
        }
    }).when('/pugs', {
        templateUrl: '/views/browser.html',
        controller: 'browserController',
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
            }
        }
    }).when('/pug/:id', {
        templateUrl: '/views/lobby.html',
        controller: 'lobbyController',
        resolve: {
            pug: function($q, $route, apiFactory) {
                var delay = $q.defer();
                apiFactory.getPug($route.current.params && $route.current.params.id).success(function(pug) {
                    delay.resolve(pug);
                }).error(function(err, status) {
                    delay.reject(err);
                });
                return delay.promise;
            }
        }
    }).when('/me', {
        templateUrl: '/views/profile.html',
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
    }).when('/profile/:id', {
        templateUrl: '/views/profile.html',
        controller: 'profileController',
        resolve: {
            profile: function($q, $route, apiFactory) {
                var delay = $q.defer();
                apiFactory.getProfile($route.current.params && $route.current.params.id).success(function(profile) {
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
    // $locationProvider.html5Mode(true);
    $httpProvider.defaults.useXDomain = true;
    delete $httpProvider.defaults.headers.common['X-Requested-With'];
});
// run
app.run(function($rootScope, $location, profileService, apiFactory) {
    // // register listener to watch route changes
    $rootScope.$on("$routeChangeStart", function(event, next, current) {
        $('.button-collapse').sideNav('hide');
    });
    $rootScope.$on("$routeChangeError", function(event, next, current, rejection) {
        if (rejection == 401) {
            location.href = "/logout";
            return;
        } else if (rejection == 403) {
            $location.path("/403");
            return;
        }
        event.preventDefault();
        $location.path("/oops");
    });
    $rootScope.logout = function() {
        location.href = "/logout";
    };
});
// controllers
app.controller('mainController', function($rootScope, $scope, apiFactory, profileService) {
    $scope.loginBlock = true;
    $scope.$watch('profileService.loggedIn', function() {
        $scope.loginBlock = false;
    });
    apiFactory.getProfile().success(function(data) {
        profileService.profile = data;
        $rootScope.profileId = data.id;
        $rootScope.isAdmin = profileService.isAdmin();
        profileService.loggedIn = true;
        if (!data) profileService.forceReload()
    });
    $(".button-collapse").sideNav();
    $('.collapsible').collapsible();
});
app.controller('navController', function($rootScope, profileService) {});
app.controller('homeController', function() {});
app.controller('loginController', function() {});
app.controller('oopsController', function() {});
app.controller('profileController', function($scope, profile) {
    $scope.profile = profile || {};
});
app.controller('adminController', function($scope, playersAndServers, apiFactory) {
    $scope.players = playersAndServers.players || [];
    $scope.servers = playersAndServers.servers || [];
    $scope.newPug = {};
    $scope.createPug = function() {
        apiFactory.createPug($scope.newPug).success(function(profile) {
            console.log(profile);
        }).error(function(err, status) {
            console.log(err, status);
        });
    };
    $scope.refresh = function() {
        apiFactory.refresh().success(function() {
            console.log("refreshed list");
        }).error(function(err, status) {
            console.log(err, status);
        });
    };
});
app.controller('browserController', function($scope, $location, apiFactory, serviceFactory, pugs) {
    $scope.pugs = pugs || {};
    serviceFactory.lobbies = pugs;
    serviceFactory.browserJoin();
    $scope.$on("$destroy", function() {
        serviceFactory.browserLeave();
        serviceFactory.unregisterObserverCallback(updatePugs);
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
        serviceFactory.unregisterObserverCallback(updateLobby);
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
    service.unregisterObserverCallback = function(callback) {
        var index = observerCallbacks.indexOf(callback);
        observerCallbacks.splice(index, 1);
    };
    return service;
});
app.factory('apiFactory', function($http, ENV) {
    var profile = {};
    profile.getProfile = function(id) {
        if (!id) {
            return $http.get('/profile');
        }
        return $http.get('/profile/' + id);
    };
    profile.getPlayersAndServers = function() {
        return $http.get('/admin');
    };
    profile.getPugs = function() {
        return $http.get(ENV.serviceEndpoint + '/pugs');
    };
    profile.getPug = function(id) {
        return $http.get(ENV.serviceEndpoint + '/pug/' + id);
    };
    profile.createPug = function(pug) {
        return $http.post(ENV.serviceEndpoint + '/pug', pug);
    };
    profile.refresh = function() {
        return $http.get(ENV.serviceEndpoint + '/refresh');
    };
    return profile;
});
// services
app.service('profileService', function() {
    this.loggedIn = false;
    this.profile = {};
    this.isAdmin = function() {
        if (this.profile.id == "76561197961790405") {
            return true;
        }
        return false;
    }
    this.forceReload = function() {
        location.reload();
    };
});
// constants
app.constant('ENV', {
    'siteEndpoint': 'http://localhost:3000',
    'serviceEndpoint': 'http://localhost:4000'
});
// filters
app.filter('getCount', function() {
    return function(items) {
        return items.length;
    }
});