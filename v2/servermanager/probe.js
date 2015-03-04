var config = require("../config");
// srcds
var srcds = require('srcds-info');
// redis
var redis = require('redis');
var r = redis.createClient(config.redis.port, config.redis.host, {
    auth_pass: config.redis.pass
});
// config
var debug = false;

function pingServer(serverId) {
    r.mget([
        ["server", serverId, "ip"].join(":"), ["server", serverId, "port"].join(":")
    ], function(err, res) {
        var client = srcds(res[0], res[1]);
        client.info(function(err, info) {
            if (err) {
                if (debug) console.error(err);
            } else {
                if (debug) console.log(res[0], res[1], "has a heartbeat");
                // set server status
                var keyServerStatus = ["server", serverId, "serverStatus"].join(":");
                var valueServerStatus = 1;
                // set current players
                var keyCurrentNumPlayers = ["server", serverId, "currentNumPlayers"].join(":");
                var valueCurrentNumPlayers = info.numPlayers;
                // set current map
                var keyCurrentMap = ["server", serverId, "currentMap"].join(":");
                var valueCurrentMap = info.map;
                // redis mset
                r.mset(keyServerStatus, valueServerStatus, keyCurrentNumPlayers, valueCurrentNumPlayers, keyCurrentMap, valueCurrentMap, redisResponse);
                r.expire(keyServerStatus, 30, redisResponse);
            }
            client.close();
        });
    });
};
// probe
function probe() {
    r.smembers("server:list", function(err, res) {
        if (err) return console.log(err);
        // ping each server
        for (var i = 0; i < res.length; i++) {
            pingServer(res[i]);
        }
    });
}
// redis repsonse handler
function redisResponse(err, res) {
    if (debug && err) console.error(err);
    if (debug && res) console.log(res);
}
probe();
setInterval(probe, 20 * 1000);