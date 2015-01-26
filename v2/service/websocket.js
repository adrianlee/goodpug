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
                // add user to redis
                var key = ["server", socket.currentLobbyId, "players"].join(":");
                client.sadd(key, socket.displayName, redis.print);
                // get lobby info with new player
                updateLobbyAndBrowser();
            });
        });
        socket.on('lobby leave', function() {
            if (!socket.currentLobbyId) return;
            console.log(socket.displayName, "leave lobby", socket.currentLobbyId);
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
            client.srem(key, socket.displayName, redis.print);
            // update lobby
            updateLobbyAndBrowser(function() {
                // dispose
                socket.leave(socket.currentLobbyId);
                socket.currentLobbyId = null;
            });
        });
        // helper functions
        function updateLobbyAndBrowser(callback) {
            if (!socket.currentLobbyId) return;
            broker.getPug(socket.currentLobbyId, function(err, pug) {
                console.log(socket.currentLobbyId, pug);
                if (err) return console.error(err);
                if (pug) {
                    // update room
                    pugs.to(socket.currentLobbyId).emit('lobby update', pug);
                    // update pugs list
                    pugs.to("browser").emit('browser update', {
                        id: pug.id,
                        players: pug.players,
                        status: pug.status
                    });
                }
                if (callback) {
                    callback();
                }
            });
        }
    });
}