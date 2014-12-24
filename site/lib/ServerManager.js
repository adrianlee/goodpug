module.exports = new ServerManager();

function ServerManager() {
	this.servers = {};
}

ServerManager.prototype.getServer = function(name) {
	return this.servers[name];
}