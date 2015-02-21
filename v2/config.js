var config = {};

config.passport = {
	returnUrl: "http://localhost:3000/auth/steam/callback",
	realm: "http://localhost:3000/",
	apiKey: "20087C97D27C353C48D3EB5CBF8F7B19"
};

config.mongodb = {
	uri: "mongodb://goodpug:123123123@ds039960.mongolab.com:39960/goodpug2"
}

config.redis = {
	host: "bojap.com",
	port: "6379",
	pass: "01895v7nh10234985y19034v85vyb01945v8"
}

// store: new RedisStore({
//   host: "pub-redis-16323.us-east-1-2.4.ec2.garantiadata.com",
//   port: "16323",
//   pass: 123123123
// }),

config.express = {
	sessionSecret: "keyboard catz",
	port: 3000
}

config.service = {
	port: 4000
}

module.exports = config;