var redis = require('redis');
redis.debug_mode = true;
function RedisClient() {
    return redis.createClient(6379, 'bojap.com', {
        auth_pass: "01895v7nh10234985y19034v85vyb01945v8"
    });
}
module.exports = new RedisClient();