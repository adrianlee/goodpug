var Connection = require("./lib/connection");
var Match = require("./match")

module.exports = Server;

function Server(name, ip, port, rcon, location) {
    // init
    this.name = name;
    this.ip = ip;
    this.port = port;
    this.rcon = rcon;
    this.location = location;

    // connection
    this.connected = false;
    this.connection = new Connection(ip, port, rcon);
    this.connection.connect(function (err) {
    	if (err) {
    		console.log("Failed to connect to server");
    		return;
    	}
    	
    	this.connected = true;
    });

    // temp
    this.password = null;
    this.match = null;
}

Server.prototype.restart = function() {
    // rcon mp_restartgame 1;
}

Server.prototype.execConfig = function() {
    // rcon mp_restartgame 1;
}

Server.prototype.setPassword = function(random) {
    // rcon sv_password random
}

Server.prototype.getPassword = function() {
    // return rcon sv_password
}

Server.prototype.startMatch = function(options) {
	if (this.match) {
		return false;
	}

	this.match = new Match(options);

	return true;
}

Server.prototype.isConnected = function(options) {
	return this.connected;
}