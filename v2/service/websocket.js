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
        socket.on('my other event', function(data) {
            console.log(data);
        });
    });
    // PUG LOBBY
    var lobby = io.of('/lobby');
    lobby.on('connection', function(socket) {
        // a player joined lobby
        socket.on('join', function(data) {
            socket.pugId = data && data.id;
            // join room
            socket.join(socket.pugId);
            // add user to lobby
            var key = ["server", socket.pugId, "players"].join(":");
            client.sadd(key, "adrian", redis.print);
            // get lobby info
            broker.getPug(socket.pugId, function(err, pug) {
                lobby.to(socket.pugId).emit('update', pug);
            });
        });
        // a user is ready
        socket.on('ready', function() {
            //
        });
        // disconnect
        socket.on('disconnect', function() {
            var key = ["server", socket.pugId, "players"].join(":");
            client.srem(key, "adrian", redis.print);
        });
    });
}