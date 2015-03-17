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
            // get list of pugs from redis
            async.map(servers, self.getServerById, function(err, results) {
                cb(err, results);
            });
        }
    ], function(err, results) {
        // filter out null servers
        callback(err, results.filter(function(n) {
            return !!n;
        }));
    });
};