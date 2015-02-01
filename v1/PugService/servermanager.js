var Server = require('./lib/server');
var DB = require("../Site/database");

var servers = {};

function refreshServerList() {
	DB.Server.find({}, function (err, docs) {
		for (var i = 0, length = docs.length; i < length; i++) {
			var server = docs[i];

			if (!servers[server._id]) {
				servers[server._id] = new Server(server.name, server.ip, server.port, server.rcon, server.location);
			} else {
				servers[server._id].name = server.name;
				servers[server._id].ip = server.ip;
				servers[server._id].port = server.port;
				servers[server._id].rcon = server.rcon;
				servers[server._id].location = server.location;
			}
		}
		console.log(servers);
	});
}

refreshServerList();

/*
1. get a list of servers from mongo
2. create a new Server object for each server
3. start log listener for each
4. exec rcon to get state of server, 
*/

// API
var express = require('express');
var app = express();

// returns a list of servers
app.get('/servers', function(req, res) {
	res.send(servers);
});

// returns server info for id
app.get('/servers/:id', function(req, res) {
	if (!servers[req.params.id]) {
		res.sendStatus(404)
	} else {	
		res.send(servers[req.params.id]);
	}
});

// returns the rcon
app.post('/rcon/:id', function(req, res) {
	if (!servers[req.params.id]) {
		res.sendStatus(404)
	} else {
		res.send(servers[req.params.id]);
	}
});

app.get('/refresh', function(req, res) {
	refreshServerList();
	res.sendStatus(200);
});

app.listen(5000);

// REPL
var repl = require("repl");

var replServer = repl.start({
  prompt: "goodpug > ",
});

replServer.context.servers = servers;



// REDIS
var redis = require("redis");
var client = redis.createClient();

client.on("error", function (err) {
    console.log("Error " + err);
});

// client.auth("somepass");