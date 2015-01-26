module.exports = new Broker();
var async = require('async');
var client = require('./redisClient');
var mongo = require('./database');

function Broker() {};
Broker.prototype.init = function() {
    // client.set("server:n13957f1-095f-1057b-1gn3j:id", "n13957f1-095f-1057b-1gn3j");
    // client.set("server:n13957f1-095f-1057b-1gn3j:name", "San Francisco #1");
    // client.set("server:n13957f1-095f-1057b-1gn3j:name", "San Francisco #1");
    // client.set("server:n13957f1-095f-1057b-1gn3j:ip", "192.168.0.1");
    // client.set("server:n13957f1-095f-1057b-1gn3j:port", "27015");
    // client.set("server:n13957f1-095f-1057b-1gn3j:location", "USWEST");
    // client.set("server:n13957f1-095f-1057b-1gn3j:status", 0);
    // client.del("server:n13957f1-095f-1057b-1gn3j:players");
    // client.sadd("server:n13957f1-095f-1057b-1gn3j:players", "irok", "cesar", "ynot", "rich");
}
Broker.prototype.getPug = function(serverId, callback) {
    // Fetch pug info & status from redis
    async.parallel({
        info: function(cb) {
            var keyId = ["server", serverId, "id"].join(":");
            var keyName = ["server", serverId, "name"].join(":");
            var keyIp = ["server", serverId, "ip"].join(":");
            var keyPort = ["server", serverId, "port"].join(":");
            var keyLocation = ["server", serverId, "location"].join(":");
            var keyStatus = ["server", serverId, "status"].join(":");
            client.mget([keyId, keyName, keyIp, keyPort, keyLocation, keyStatus], function(err, info) {
                cb(err, info);
            });
        },
        players: function(cb) {
            var keyPlayers = ["server", serverId, "players"].join(":");
            client.smembers(keyPlayers, function(err, players) {
                cb(err, players);
            });
        }
    }, function(err, results) {
        var server = {};
        server.id = results.info[0];
        server.name = results.info[1];
        server.ip = results.info[2];
        server.port = results.info[3];
        server.location = results.info[4];
        server.status = results.info[5];
        server.players = results.players;
        if (!server.id && !server.ip) {
            return callback(err, null);
        }
        callback(err, server);
    });
}
Broker.prototype.setPug = function(server, callback) {
    var keyId = ["server", server._id, "id"].join(":");
    var keyName = ["server", server._id, "name"].join(":");
    var keyIp = ["server", server._id, "ip"].join(":");
    var keyPort = ["server", server._id, "port"].join(":");
    var keyLocation = ["server", server._id, "location"].join(":");
    var valueId = server._id;
    var valueName = server.name;
    var valueIp = server.ip;
    var valuePort = server.port;
    var valueLocation = server.location;
    client.mset(keyId, valueId, keyName, valueName, keyIp, valueIp, keyPort, valuePort, keyLocation, valueLocation);
    client.sadd("server:list", valueId);
    if (callback) {
        callback(null, server._id);
    }
}
Broker.prototype.getPugs = function(callback) {
    var self = this;
    // get server list from redis, getPug on each server
    async.waterfall([
        function(cb) {
            client.smembers("server:list", function(err, servers) {
                cb(err, servers);
            });
        },
        function(servers, cb) {
          async.map(servers, self.getPug, function(err, results) {
            console.log(results);
            cb(err, results);
          });
        }
    ], function(err, results) {
      callback(err, results);
    });
}
Broker.prototype.refreshPugList = function(callback) {
    var self = this;
    async.waterfall([
        function(cb) {
            mongo.Server.find({}, "name location ip port", function(err, servers) {
                cb(err, servers);
            });
        },
        function(servers, cb) {
            async.map(servers, self.setPug, function(err, results) {
                cb(null, results);
            });
        }
    ], function(err, results) {
        if (callback) callback(err, results);
    });
}