var redis = require('redis');
var redisAdapter = require('socket.io-redis');
var client = require('./redisClient');
var broker = require('./broker');
module.exports = function(server) {
    var io = require('socket.io').listen(server);
    // REDIS ADAPTER
    var pub = redis.createClient(6379, 'bojap.com', {
        auth_pass: "01895v7nh10234985y19034v85vyb01945v8"
    });
    var sub = redis.createClient(6379, 'bojap.com', {
        detect_buffers: true,
        auth_pass: "01895v7nh10234985y19034v85vyb01945v8"
    });
    io.adapter(redisAdapter({
        pubClient: pub,
        subClient: sub
    }));
    // PUGS
    var pugs = io.of('/pugs');
    pugs.on('connection', function(socket) {
        console.log(socket.handshake.headers.cookie);
        // lobby
        socket.on('lobby join', function(data) {
            // save user settings to socket
            socket.currentLobbyId = data && data.id;
            socket.displayName = data && data.displayName;
            console.log(socket.displayName, "joined lobby", socket.currentLobbyId);
            // join room
            socket.join(socket.currentLobbyId);
            // get latest lobby info
            broker.getPug(socket.currentLobbyId, function(err, pug) {
                if (pug.matchStatus == null) {
                    if (pug.players.length < pug.maxPlayers) {
                        // add user to redis
                        var keyPlayers = ["server", socket.currentLobbyId, "players"].join(":");
                        var keyReadyPlayers = ["server", socket.currentLobbyId, "ready"].join(":");
                        client.sadd(keyPlayers, socket.displayName, redis.print);
                        client.expire(keyPlayers, 60);
                        // get lobby info with new player
                        updateLobbyAndBrowser();
                    }
                }
            });
        });
        socket.on('lobby heartbeat', function(data) {
            if (!socket.displayName || !socket.currentLobbyId) return;
            // do we need this?
            // broker.getPug(socket.currentLobbyId, function(err, pug) {
            //     if (pug.matchStatus == null) {
            //         if (pug.players && pug.players.indexOf(socket.displayName) > -1) {
            //             var keyPlayers = ["server", socket.currentLobbyId, "players"].join(":");
            //             client.sadd(keyPlayers, socket.displayName, redis.print);
            //             client.expire(keyPlayers, 60);
            //         }
            //     }
            // });
            var keyPlayers = ["server", socket.currentLobbyId, "players"].join(":");
            client.sismember(keyPlayers, socket.displayName, function(err, res) {
                if (res == 1) {
                    var keyPlayers = ["server", socket.currentLobbyId, "players"].join(":");
                    client.sadd(keyPlayers, socket.displayName, redis.print);
                    client.expire(keyPlayers, 60);
                }
            });
        });
        socket.on('lobby ready', function() {
            console.log("ready", socket.displayName, socket.currentLobbyId);
            var keyPlayers = ["server", socket.currentLobbyId, "players"].join(":");
            var keyPlayersReady = ["server", socket.currentLobbyId, "ready"].join(":");
            var keyMaxPlayers = ["server", socket.currentLobbyId, "maxPlayers"].join(":");
            // get max players
            client.get(keyMaxPlayers, function(err, maxPlayers) {
                // add player to ready list
                client.sadd(keyPlayersReady, socket.displayName, function(err, res) {
                    // get players length in lobby
                    client.smembers(keyPlayers, function(err, players) {
                        if (players.length == maxPlayers) {
                            // diff lobby and ready players
                            client.sdiff(keyPlayers, keyPlayersReady, function(err, diffPlayers) {
                                if (diffPlayers && diffPlayers.length == 0) {
                                    // create a match
                                    broker.createMatch({
                                        server: socket.currentLobbyId,
                                        players: players
                                      }, function(err, match) {
                                        var keyMatchStatus = ["server", socket.currentLobbyId, "matchStatus"].join(":");
                                        client.set(keyMatchStatus, match._id, function(err, res) {
                                            updateLobbyAndBrowser();
                                        });
                                    });
                                } else {
                                    updateLobbyAndBrowser();
                                }
                            });
                        } else {
                            updateLobbyAndBrowser();
                        }
                    });
                });
            });
        });
        socket.on('lobby leave', function() {
            if (!socket.currentLobbyId) return;
            console.log(socket.displayName, "left lobby", socket.currentLobbyId);
            // remove user from redis
            var key = ["server", socket.currentLobbyId, "players"].join(":");
            client.srem(key, socket.displayName, redis.print);
            // update lobby
            updateLobbyAndBrowser(function() {
                // dispose
                socket.leave(socket.currentLobbyId);
                socket.currentLobbyId = null;
            });
        });
        // browser
        socket.on('browser join', function() {
            socket.join("browser");
        });
        socket.on('browser leave', function() {
            socket.leave("browser");
        });
        // disconnect
        socket.on('disconnect', function() {
            console.log(socket.displayName, "disconnect");
            // update redis
            var key = ["server", socket.currentLobbyId, "players"].join(":");
            client.srem(key, socket.displayName, function(err, res) {
                // update lobby
                updateLobbyAndBrowser(function() {
                    // dispose
                    socket.leave(socket.currentLobbyId);
                    socket.currentLobbyId = null;
                });
            });
        });
        // helper functions
        function updateLobbyAndBrowser(callback) {
            if (!socket.currentLobbyId) return;
            broker.getPug(socket.currentLobbyId, function(err, pug) {
                if (err) return console.error(err);
                if (pug) {
                    // if we don't have a full lobby, clear the ready list.
                    if (pug.players && pug.players.length.toString() !== pug.maxPlayers) {
                        clearReadyPlayers(socket);
                        pug.playersReady = [];
                    }
                    // update room
                    pugs.to(socket.currentLobbyId).emit('lobby update', pug);
                    // update pugs list
                    pugs.to("browser").emit('browser update', {
                        id: pug.id,
                        players: pug.players,
                        matchStatus: pug.matchStatus
                    });
                }
                if (callback) {
                    callback();
                }
            });
        };

        function clearReadyPlayers(socket) {
            if (socket.currentLobbyId && socket.displayName) {
                var key = ["server", socket.currentLobbyId, "ready"].join(":");
                client.del(key, redis.print);
            }
        };
    });
}