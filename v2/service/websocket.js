var redis = require('redis');
var redisAdapter = require('socket.io-redis');

module.exports = function(server) {
    var io = require('socket.io').listen(server);
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
        setInterval(function() {
            socket.emit('news', {
                hello: 'world'
            });
        }, 500);
        socket.on('my other event', function(data) {
            console.log(data);
        });
    });
    // PUG LOBBY
    var lobby = io.of('/lobby');
    lobby.on('connection', function(socket) {
        setInterval(function() {
            socket.emit('news', {
                hello: 'world'
            });
        }, 500);
        socket.on('my other event', function(data) {
            console.log(data);
        });
    });
}