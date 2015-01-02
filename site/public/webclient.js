var GoodPug = angular.module('goodPug', []);

GoodPug.controller("mainController", function ($scope, $http) {

});

GoodPug.controller("lobbyController", function ($scope, $http) {
    console.log("Joined Lobby");
    
    $scope.server = {};

    var socket = io();

    socket.on('player joined', function (data) {
      console.log(data.displayName + ' joined');
    });

    socket.on('player left', function (data) {
      console.log(data + ' left');
    });

    socket.on('new message', function (data) {
      console.log(data)
    });

    socket.on('room update', function (data) {
      $scope.lobbyState = "lobby";

      $scope.matchFound = data.ready;
      $scope.$apply();

      $(".player-count").html(data.playerCount);
      $(".player-count").html(data.playerCount);
      $(".room-status").html(data.ready ? "Ready" : "Waiting for players");
      $(".player-list").html("");
      for (var i in data.players) {
        if (data.players[i] && data.players[i].ready) {
          $(".player-list").append("<li><b>" + data.players[i].displayName + "</b></li>");
        } else {
          $(".player-list").append("<li>" + data.players[i].displayName + "</li>");
        }

        //- socket.emit("player ready");
      }

      
    });

    socket.on('start match', function (data) {
      startMatch(data);
    });

    function join() {
      socket.emit('join room', {
        id: _data.id,
        displayName: _data.displayName,
        room: _data.room
      });
    }

    function ready() {
      socket.emit("player ready");
    }

    function startMatch(connectionInfo) {
      location.href = connectionInfo;
    }

    join();
});