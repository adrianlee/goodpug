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
        setInterval(function() {
            socket.emit('news', {
                hello: 'world'
            });
        }, 1000);
        socket.on('my other event', function(data) {
            console.log(data);
        });
    });
    // PUG LOBBY
    var lobby = io.of('/lobby');
    lobby.on('connection', function(socket) {
        setInterval(function () {
          lobby.to(socket.pugId).emit('update', {});
        }, 1000)
        // a player joined lobby
        socket.on('join', function(data) {
            // add user to lobby
            socket.pugId = data && data.id;
            socket.join(data && data.id);

            // get lobby info
            // var key = ["server", data.id, "players"].join(":");
            // client.sadd(key, "adrian", redis.print);

            // update lobby
            broker.getPug(socket.pugId, function(err, pug) {
                lobby.to(socket.pugId).emit('update', pug);
            });
        });
        // a user is ready
        socket.on('ready', function () {
            //
        });
    });
}