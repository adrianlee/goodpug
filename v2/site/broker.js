module.exports = new Broker();
var async = require('async');
var client = require('./redisClient');
var mongo = require('./database');

function Broker() {};
Broker.prototype.init = function() {};
// get pug from redis
Broker.prototype.getServerById = function(serverId, callback) {
    if (!serverId) {
        return;
    }
    // Fetch pug info & status from redis
    async.parallel({
        info: function(cb) {
            var keyId = ["server", serverId, "id"].join(":");
            var keyName = ["server", serverId, "name"].join(":");
            var keyIp = ["server", serverId, "ip"].join(":");
            var keyPort = ["server", serverId, "port"].join(":");
            var keyLocation = ["server", serverId, "location"].join(":");
            var keyServerStatus = ["server", serverId, "serverStatus"].join(":");
            var keyMatchStatus = ["server", serverId, "matchStatus"].join(":");
            var keyMaxPlayers = ["server", serverId, "maxPlayers"].join(":");
            client.mget([keyId, keyName, keyIp, keyPort, keyLocation, keyServerStatus, keyMatchStatus, keyMaxPlayers], function(err, info) {
                cb(err, info);
            });
        },
        teamA: function (cb) {
            var keyTeamA = ["server", serverId, "teamA"].join(":");
            client.smembers(keyTeamA, function(err, players) {
                cb(err, players);
            });
        },
        teamB: function (cb) {
            var keyTeamB = ["server", serverId, "teamB"].join(":");
            client.smembers(keyTeamB, function(err, players) {
                cb(err, players);
            });
        },
        playersReady: function(cb) {
            var keyPlayersReady = ["server", serverId, "ready"].join(":");
            client.smembers(keyPlayersReady, function(err, players) {
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
        server.serverStatus = results.info[5];
        server.matchStatus = results.info[6];
        server.maxPlayers = results.info[7] || 10;
        server.teamA = results.teamA || [];
        server.teamB = results.teamB || [];
        server.numPlayers = (server.teamA.length + server.teamB.length);
        server.playersReady = results.playersReady;
        if (!server.id && !server.ip) {
            return callback(err, null);
        }
        callback(err, server);
    });
};
// list pugs from redis
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
            async.map(servers, self.getServerById, function(err, results) {
                cb(err, results);
            });
        }
    ], function(err, results) {
        callback(err, results.filter(function(n) {
            return !!n;
        }));
    });
};
// set pug in redis
Broker.prototype.setPug = function(server, callback) {
    var keyId = ["server", server._id, "id"].join(":");
    var keyName = ["server", server._id, "name"].join(":");
    var keyIp = ["server", server._id, "ip"].join(":");
    var keyPort = ["server", server._id, "port"].join(":");
    var keyLocation = ["server", server._id, "location"].join(":");
    var keyMaxPlayers = ["server", server._id, "maxPlayers"].join(":");
    var valueId = server._id;
    var valueName = server.name;
    var valueIp = server.ip;
    var valuePort = server.port;
    var valueLocation = server.location;
    var valueMaxPlayers = server.maxPlayers;
    if (!valueId || !valueName || !valueIp || !valuePort || !valueLocation || !valueMaxPlayers) {
        return;
    }
    client.mset(keyId, valueId, keyName, valueName, keyIp, valueIp, keyPort, valuePort, keyLocation, valueLocation, keyMaxPlayers, valueMaxPlayers);
    client.sadd("server:list", valueId);
    if (callback) {
        callback(null, server._id);
    }
};
// get a list of server from mongo and update list on redis
Broker.prototype.refreshPugList = function(callback) {
    var self = this;
    async.waterfall([
        function(cb) {
            mongo.Server.find({}, "name location ip port maxPlayers", function(err, servers) {
                cb(err, servers);
            });
        },
        function(servers, cb) {
            client.del("server:list", function() {
                cb(null, servers);
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
};