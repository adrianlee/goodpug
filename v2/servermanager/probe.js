// redis
var redis = require('redis');
var r = redis.createClient(6379, 'bojap.com', {
    auth_pass: "01895v7nh10234985y19034v85vyb01945v8"
});
// config
var debug = false;
// srcds
var srcds = require('srcds-info');

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
                var keyServerStatus = ["server", serverId, "serverStatus"].join(":");
                r.set(keyServerStatus, 1, redisResponse);
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