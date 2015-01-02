var _ = require("lodash");

module.exports = Server;

function Server(options) {
	// room info
	this.name = options.name;
	this.players = {};
	this.status = 0;
	this.readyCount = 0;
	this.location = "WEST";

	// server info
	this.ip = "104.236.164.175";
	this.port = "27015";
	this.password = "omg";
};

Server.prototype.READYLIMIT = 2;

Server.prototype.addPlayer = function (player) {
	return this.players[player.id] = player;
};

Server.prototype.removePlayer = function (playerId) {
	if (this.players[playerId]) {
		delete this.players[playerId];
		return true;
	}
	return false;
};

Server.prototype.getPlayer = function (playerId) {
	return this.players[playerId];
}

Server.prototype.playerCount = function () {
	return _.size(this.players);
};

Server.prototype.isReady = function () {
	return this.playerCount() >= this.READYLIMIT;
};

Server.prototype.playerReady = function(playerId) {
	if (this.players[playerId]) {
		this.players[playerId].ready = true;
		return true;
	}

	return false;
};

Server.prototype.getConnectionInfo = function () {
	var connectionInfo = "steam://connect/" + this.ip + ":" + this.port;

	if (this.password) {
		connectionInfo += "/" + this.password;
	}

	return connectionInfo;
}