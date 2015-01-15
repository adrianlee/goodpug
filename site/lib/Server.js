var _ = require("lodash");
module.exports = Server;

function Server(options) {
    // room info
    this.status = 0;  // 0 - lobby, 1 - live
    this.players = {};
    this.readyCount = 0;
    // server info
    this.id = options._id;
    this.name = options.name;
    this.ip = options.ip;
    this.port = options.port;
    this.location = options.location;
};

Server.prototype.READYLIMIT = 2;

Server.prototype.addPlayer = function(player) {
    return this.players[player.id] = player;
};

Server.prototype.removePlayer = function(playerId) {
    if (this.players[playerId]) {
        delete this.players[playerId];
        return true;
    }
    return false;
};

Server.prototype.getPlayer = function(playerId) {
    return this.players[playerId];
}

Server.prototype.playerCount = function() {
    return _.size(this.players);
};

Server.prototype.isReady = function() {
    return this.playerCount() >= this.READYLIMIT;
};

Server.prototype.playerReady = function(playerId) {
    if (this.players[playerId]) {
        this.players[playerId].ready = true;
        return true;
    }
    return false;
};

Server.prototype.playerReadyReset = function(playerId) {
    for (var i in this.players) {
        this.players[i].ready = false;
    }
};

Server.prototype.getConnectionInfo = function() {
    var connectionInfo = "steam://connect/" + this.ip + ":" + this.port;
    if (this.password) {
        connectionInfo += "/" + this.password;
    }
    return connectionInfo;
}