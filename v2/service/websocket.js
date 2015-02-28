var config = require("../config")
var async = require('async');
var redis = require('redis');
var redisAdapter = require('socket.io-redis');
var client = require('./redisClient');
var broker = require('./broker');
module.exports = function(server) {
    var io = require('socket.io').listen(server);
    // REDIS ADAPTER
    var pub = redis.createClient(config.redis.port, config.redis.host, {
        auth_pass: config.redis.pass
    });
    var sub = redis.createClient(config.redis.port, config.redis.host, {
        detect_buffers: true,
        auth_pass: config.redis.pass
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
        });
        socket.on('lobby join team', function(team) {
            if (!socket.displayName || !socket.currentLobbyId) return;
            // get latest lobby info
            broker.getPug(socket.currentLobbyId, function(err, pug) {
                // ensure we are not yet live
                if (pug.matchStatus) return;
                // join if team A has empty slots
                if (team == 0 && pug.teamA.length < pug.maxPlayers / 2) {
                    async.parallel([
                        function(cb) {
                            // are we already on another team?
                            if (pug.teamB.indexOf(socket.displayName) > -1) {
                                var teamB = ["server", socket.currentLobbyId, "teamB"].join(":");
                                client.srem(teamB, socket.displayName, cb);
                            } else {
                                cb(null, true);
                            }
                        },
                        function(cb) {
                            // join new team
                            var keyTeamA = ["server", socket.currentLobbyId, "teamA"].join(":");
                            client.sadd(keyTeamA, socket.displayName, function() {
                                // set socket
                                socket.team = 0;
                                // set key expire
                                client.expire(keyTeamA, 30);
                                cb(null, true);
                            });
                        }
                    ], function(err, results) {
                        if (err) return;
                        // update lobby
                        updateLobbyAndBrowser();
                    });
                }
                // join if team B has empty slots
                if (team == 1 && pug.teamB.length < pug.maxPlayers / 2) {
                    async.parallel([
                        function(cb) {
                            // are we already on another team?
                            if (pug.teamA.indexOf(socket.displayName) > -1) {
                                var teamA = ["server", socket.currentLobbyId, "teamA"].join(":");
                                client.srem(teamA, socket.displayName, cb);
                            } else {
                                cb(null, true);
                            }
                        },
                        function(cb) {
                            // join new team
                            var keyTeamB = ["server", socket.currentLobbyId, "teamB"].join(":");
                            client.sadd(keyTeamB, socket.displayName, function() {
                                // set socket
                                socket.team = 1;
                                // set key expire
                                client.expire(keyTeamB, 30);
                                cb(null, true);
                            });
                        }
                    ], function(err, results) {
                        if (err) return;
                        // update lobby
                        updateLobbyAndBrowser();
                    });
                }
            });
        });
        socket.on('lobby heartbeat', function(data) {
            if (!socket.displayName || !socket.currentLobbyId || socket.team == undefined || socket.team == null) return;
            console.log("heart beat for", socket.displayName, socket.currentLobbyId, socket.team);
            console.log("heartbeat saved")
            var keyTeam = ["server", socket.currentLobbyId, socket.team == 0 ? "teamA" : "teamB"].join(":");
            client.sismember(keyTeam, socket.displayName, function(err, res) {
                if (res == 1) {
                    client.sadd(keyTeam, socket.displayName, redis.print);
                    client.expire(keyTeam, 30);
                }
            });
        });
        socket.on('lobby ready', function() {
            if (!socket.displayName || !socket.currentLobbyId || socket.team == undefined || socket.team == null) return;
            console.log("ready", socket.displayName, socket.currentLobbyId);
            async.parallel({
                players: function(cb) {
                    var keyTeamA = ["server", socket.currentLobbyId, "teamA"].join(":");
                    var keyTeamB = ["server", socket.currentLobbyId, "teamB"].join(":");
                    client.sunion(keyTeamA, keyTeamB, function(err, players) {
                        cb(err, players);
                    });
                },
                playersReady: function(cb) {
                    var keyPlayersReady = ["server", socket.currentLobbyId, "ready"].join(":");
                    client.sadd(keyPlayersReady, socket.displayName, function(err, res) {
                        client.smembers(keyPlayersReady, cb);
                    });
                },
                maxPlayers: function(cb) {
                    var keyMaxPlayers = ["server", socket.currentLobbyId, "maxPlayers"].join(":");
                    client.get(keyMaxPlayers, function(err, res) {
                        console.log("max players res", res);
                        cb(err, res || 10);
                    });
                }
            }, function(err, results) {
                if (err) return;
                console.log(results);
                // did everyone ready up?
                console.log(results.players.length, results.playersReady.length, parseInt(results.maxPlayers, 10));
                if (results.players.length == results.playersReady.length && results.playersReady.length.toString() == results.maxPlayers) {
                    console.log("Verifying everyone is ready");
                    // check if each player has ready up
                    for (var i = 0; i < results.players.length; i++) {
                        // return if player doesn't exist
                        console.log(results.players[i]);
                        console.log(results.playersReady.indexOf(results.players[i]));
                        if (results.playersReady.indexOf(results.players[i]) == -1) {
                            return;
                        }
                    }
                    console.log("Creating match");
                    // create match if we reach here
                    broker.createMatch({
                        server: socket.currentLobbyId,
                        players: results.players
                    }, function(err, match) {
                        console.log("Match created", match._id);
                        var keyMatchStatus = ["server", socket.currentLobbyId, "matchStatus"].join(":");
                        client.set(keyMatchStatus, match._id, function(err, res) {
                            updateLobbyAndBrowser();
                        });
                    });
                }
            });
        });
        socket.on('lobby leave', function() {
            console.log(socket.displayName, "left lobby");
            leaveLobby(socket);
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
            leaveLobby(socket);
        });
        
        // helper functions
        function updateLobbyAndBrowser(callback) {
            if (!socket.currentLobbyId) return;
            broker.getPug(socket.currentLobbyId, function(err, pug) {
                if (err) return console.error(err);
                if (pug) {
                    // if we don't have a full lobby, clear the ready list.
                    if (pug.numPlayers.toString() !== pug.maxPlayers) {
                        clearReadyPlayers(socket);
                        pug.playersReady = [];
                    }
                    // update room
                    pugs.to(socket.currentLobbyId).emit('lobby update', pug);
                    // update pugs list
                    pugs.to("browser").emit('browser update', {
                        id: pug.id,
                        numPlayers: pug.numPlayers,
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

        function leaveLobby(socket) {
            if (!socket.displayName || !socket.currentLobbyId || socket.team == null || socket.team == undefined) return;
            var notifyLobby = function() {
                // update lobby
                updateLobbyAndBrowser(function() {
                    // dispose
                    socket.leave(socket.currentLobbyId);
                    socket.currentLobbyId = null;
                });
            };
            leaveTeam(socket, notifyLobby);
        };

        function leaveTeam(socket, callback) {
            if (!socket.displayName || !socket.currentLobbyId || socket.team == null || socket.team == undefined) return;
            // update redis
            var key = ["server", socket.currentLobbyId, socket.team == 0 ? "teamA" : "teamB"].join(":");
            client.srem(key, socket.displayName, function(err, res) {
                socket.team = null;
                if (callback) {
                    callback();
                }
            });
        };
    });
}