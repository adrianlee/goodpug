var Connection = require("./connection");
var Match = require("./match");

var _connection;

var ip = "76.104.160.191";
var port = "8007";


function Server(name, ip, port, rcon, location) {
	var self = this;

    // Server Properties
    self.name = name;
    self.ip = ip;
    self.port = port;
    self.rcon = rcon;
    self.location = location;

    // Are we connected to the server?
    self.connected = false;
    
    // Set up rcon connection to server
    // _connection = new Connection(ip, port, rcon);
    // _connection.connect(function (err) {
    // 	if (err) {
    // 		console.log("Failed to connect to server");
    // 		return;
    // 	}
    // 	console.log("connected true");
    // 	self.connected = true;
    // });

    // Match & Password
    self.password = null;
    self.match = null;

    self.addLogListener();
}

Server.prototype.exec = function(cmd) {
	var self = this;

    var rcon = new Connection(self.ip, self.port, self.rcon);

    rcon.connect(function (err, res) {
    	if (err) {
    		console.log("Failed to connect to server", err);
    		return;
    	}
	    rcon.exec(cmd, function (res) {
	    	console.log(res);
	    	return res;
	    	rcon.close();
	    });
    });
}

Server.prototype.restart = function() {
	var self = this;

    var rcon = new Connection(self.ip, self.port, self.rcon);

    rcon.connect(function (err, res) {
    	if (err) {
    		console.log("Failed to connect to server", err);
    		return;
    	}
	    rcon.exec("say restarting 1; mp_restartgame 1", function (res) {
	    	console.log(res);
	    	return res;
	    	rcon.close();
	    });
    });
}

Server.prototype.changelevel = function(map) {
	var self = this;

    var rcon = new Connection(self.ip, self.port, self.rcon);

    rcon.connect(function (err) {
    	if (err) {
    		console.log("Failed to connect to server");
    		return false;
    	}
	    rcon.exec("changelevel " + map, function (res) {
	    	console.log(res);
	    	rcon.close();
	    	return true;
	    });
    });
}

Server.prototype.execConfig = function(config) {
	var self = this;

    var rcon = new Connection(self.ip, self.port, self.rcon);

    rcon.connect(function (err) {
    	if (err) {
    		console.log("Failed to connect to server");
    		return false;
    	}
	    rcon.exec("exec " + config, function (res) {
	    	console.log(res);
	    	rcon.close();
	    	return true
	    });
    });
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

Server.prototype.addLogListener = function() {
	var self = this;

	var rcon = new Connection(self.ip, self.port, self.rcon);

	rcon.connect(function (err) {
    	if (err) {
    		console.log("Failed to connect to server");
    		return false;
    	}

	    rcon.exec("log on", function (res) {
		    // console.log(res);
		    rcon.exec("logaddress_delall", function (res) {
		    	// console.log(res);
				rcon.exec("logaddress_add " + ip + ":" + port, function (res) {
					rcon.exec("users", function (res) {
					  console.log(res);
					  rcon.close();
					  return true;
					});
				});
		    });
		});
    });
}

module.exports = Server;
