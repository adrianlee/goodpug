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
    $scope.resetMatchStatus = function(server) {
        if (!server) return;
        console.log(server);
        apiFactory.resetMatchStatus(server._id).success(function() {
            toast(server.name + " - reset match - OK", 2000);
        }).error(function(err, status) {
            toast(server.name + " - reset match - Error", 2000);
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
        if (!pug.serverStatus) {
          toast(pug.name + " is temporarily offline.", 2000);
          return;
        }
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
app.controller('lobbyController', function($scope, pug, serviceFactory, profileService, apiFactory) {
    $scope.pug = pug;
    serviceFactory.lobbyJoin(pug.id, profileService.profile);
    $scope.teamA = [
      { name: "trollmiester", image: "http://cdn.akamai.steamstatic.com/steamcommunity/public/images/avatars/f3/f3129bb4f15a3b66870a98a6f4fae68f0bf3a194_full.jpg"},
      { name: "joshua", image: "http://cdn.akamai.steamstatic.com/steamcommunity/public/images/avatars/3c/3c07d38199e53e339a3a8539080356113537fd7f_full.jpg" },
      { name: "jaze", image: "http://cdn.akamai.steamstatic.com/steamcommunity/public/images/avatars/48/48531bf74bba002cb23eb7ebc91876508ea00b0b_full.jpg" },
      { name: "bot derp", image: "http://cdn.akamai.steamstatic.com/steamcommunity/public/images/avatars/97/97c8eef4a3eaae1b930f651435ac9a6baf7979ee_full.jpg" },
      { name: "unknown", image: "http://cdn.akamai.steamstatic.com/steamcommunity/public/images/avatars/fe/fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb_full.jpg" }
    ];
    $scope.teamB = [
      { name: "jun", image: "http://cdn.akamai.steamstatic.com/steamcommunity/public/images/avatars/5f/5ff77d619082d52793fdca69ed63121a82184b61_full.jpg"},
      { name: "cesar", image: "http://cdn.akamai.steamstatic.com/steamcommunity/public/images/avatars/68/686ea0cedd2b234698a3603b8a9c06563a542992_full.jpg" },
      { name: "liqvid", image: "http://cdn.akamai.steamstatic.com/steamcommunity/public/images/avatars/9d/9d19937bb7d40cb11efd66d25bcb91d820e0ac08_full.jpg" },
      { name: "steven", image: "http://cdn.akamai.steamstatic.com/steamcommunity/public/images/avatars/00/003bb53124fb654d6e1ae5320ce02cf56a7ce710_full.jpg" },
      { name: "lobstar", image: "http://cdn.akamai.steamstatic.com/steamcommunity/public/images/avatars/15/15c03c1843903ec2871b1f556170bec9df1be101_full.jpg" }
    ];
    var heartbeat = setInterval(function() {
        if ($scope.pug && $scope.pug.matchStatus) return;
        serviceFactory.lobbyHeartbeat();
    }, 45 * 1000);
    $scope.$on("$destroy", function() {
        serviceFactory.lobbyLeave();
        serviceFactory.unregisterObserverCallback(updateLobby);
        clearInterval(heartbeat);
    });
    $scope.join = function() {
        if ($scope.pug && $scope.pug.matchStatus !== null) return;
        for (var i in $scope.pug.players) {
            if ($scope.pug.players[i] == profileService.profile.displayName) {
                return console.log("already joined");
            }
        }
        serviceFactory.lobbyJoin(pug.id, profileService.profile);
    };
    $scope.ready = function() {
        if ($scope.pug && $scope.pug.matchStatus !== null) return;
        if ($scope.pug.players && $scope.pug.players.length.toString() !== $scope.pug.maxPlayers) return;
        serviceFactory.lobbyReady();
    };
    $scope.connect = function() {
        if ($scope.pug && $scope.pug.matchStatus == null) return;
        if ($scope.pug.ip && $scope.pug.port) {
            location.href = "steam://connect/" + $scope.pug.ip + ":" + $scope.pug.port;
        }
    };
    var updateLobby = function() {
        // update pug info if joined
        if (serviceFactory.currentLobby) {
            $scope.pug = serviceFactory.currentLobby;
            // should the ready button be enabled
            if ($scope.pug.players.length == $scope.pug.maxPlayers) {
                $scope.readyButtonEnabled = true;
            } else {
                $scope.readyButtonEnabled = false;
            }
            // did we join the lobby?
            if ($scope.pug.players.indexOf(profileService.profile.displayName) > -1) {
                $scope.inLobby = true;
            } else {
                $scope.inLobby = false;
            }
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
            service.lobbies[pug.id].matchStatus = pug.matchStatus;
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
    service.lobbyReady = function() {
        // ready
        console.log("lobby ready");
        socket.emit("lobby ready");
    };
    service.lobbyHeartbeat = function() {
        // heartbeat
        console.log("lobby heartbeat");
        socket.emit("lobby heartbeat");
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
    profile.resetMatchStatus = function(sid) {
        return $http.get(ENV.serviceEndpoint + '/resetMatchStatus/' + sid);
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