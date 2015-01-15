var db = require("../database");
var request = require("superagent");
var Server = require("./Server");

function ServerManager() {
	this.servers = {};
}

// Get server by name
ServerManager.prototype.getServer = function(name) {
	return this.servers[name];
}

// Server list that is sent to clients for each update
ServerManager.prototype.getServerList = function () {
  var serverList = [];
  var server = {};

  for (var i in this.servers) {
    server = {};
    server.id = this.servers[i].id;
    server.name = this.servers[i].name;
    server.location = this.servers[i].location;
    server.status = this.servers[i].status;
    server.players = this.servers[i].players && Object.keys(this.servers[i].players).length;

    serverList.push(server)
  }

  return serverList;
}

// Initalization to populate server list for the Server Manager
ServerManager.prototype.init = function () {
  var self = this;

  db.Server.find({}, function (err, docs) {
    console.log(docs);

    for (var i = 0, length = docs.length; i < length; i++) {
      var doc = docs[i];
      self.servers[doc._id] = new Server(docs[i]);
    }
  });
}

module.exports = new ServerManager();