var db = require("../database");
var request = require("superagent");
var Server = require("./Server");

function ServerManager() {
	this.servers = {};
}

ServerManager.prototype.getServer = function(name) {
	return this.servers[name];
}

ServerManager.prototype.init = function () {
  var self = this;

  // request.get("localhost:5000/servers", function (err, res) {
  //   if (err) return console.error(err);

  //   console.log(res.body);
  //   self.servers = res.body;
  // });

  db.Server.find({}, function (err, docs) {
    console.log(docs);

    for (var i = 0, length = docs.length; i < length; i++) {
      var doc = docs[i];
      self.servers[doc._id] = new Server(docs[i]);
    }
  });
}

module.exports = new ServerManager();