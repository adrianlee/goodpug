var config = require("../config");
var redis = require('redis');
// redis.debug_mode = true;
function RedisClient() {
    return redis.createClient(config.redis.port, config.redis.host, {
        auth_pass: config.redis.pass
    });
}
module.exports = new RedisClient();