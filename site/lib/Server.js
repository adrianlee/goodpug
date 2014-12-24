var _ = require("lodash");

module.exports = Server;

var READYLIMIT = 10;

function Server(options) {
	this.name = options.name;
	this.players = {};
	this.status = 0;
	this.location = "WEST";
	this.ip = null;
	this.readyCount = 0;
};

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

Server.prototype.playerCount = function () {
	return _.size(this.players);
};

Server.prototype.isReady = function () {
	return this.playerCount() == READYLIMIT;
};

Server.prototype.playerReady = function(playerId) {
	if (this.players[playerId]) {
		this.players[playerId].ready = true;
		return true;
	}

	return false;
};