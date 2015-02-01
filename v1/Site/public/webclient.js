var GoodPug = angular.module('goodPug', []);

GoodPug.controller("mainController", function ($scope) {

});

GoodPug.controller("lobbyController", function ($scope) {
    console.log("Joined Lobby");
    
    $scope.server = {};
    $scope.server.status = -1;

    var socket = io("/lobby");

    // ROOM UPDATES
    socket.on('lobby update', function (data) {
      console.log("lobby update", data);

      $scope.server = data;
      $scope.$apply();
    });

    socket.on('start match', function (data) {
      if (confirm("Match found, press OK to join server.")) {
        $scope.startMatch(data);
      }
    });

    // MATCH LIVE
    socket.on('live', function (data) {
      console.log("live", data);
      $scope.server = data;
      $scope.$apply();
    });

    // ROOM CHAT
    socket.on('player joined', function (data) {
      console.log(data.displayName + ' joined');
    });

    socket.on('player left', function (data) {
      console.log(data + ' left');
    });

    socket.on('new message', function (data) {
      console.log(data);
    });


    function join() {
      socket.emit('join lobby', {
        id: _data.id,
        displayName: _data.displayName,
        room: _data.room
      });
    }

    $scope.ready = function() {
      socket.emit("player ready");
    };

    $scope.startMatch = function(connectionInfo) {
      location.href = connectionInfo;
    }

    join();
});

GoodPug.controller("serverListController", function ($scope) {
  $scope.servers = [];

  var home = io('/home');

  // PUG SERVERS
  home.on("servers", function (data) {
    console.log(data);
    var array = $.map(data, function(value, index) {
        $scope.servers = [value];
        $scope.$apply();
    });
  })

  home.emit("servers");

  $scope.joinRoom = function (server) {
    location.href = "/lobby/" + server.id;
  }
});