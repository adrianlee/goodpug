var net = require("net");
var req = require("./req");

var EventEmitter = require('events').EventEmitter;

var Request = require("./socket/request");
var Response = require("./socket/response");

var connection;
var packetId = 0;

var Connection = function (host, port, rconPassword) {
	var self = this;

	self.connection = null;
	self.queue = [];
	self.packetId = 0;

	self.host = host;
	self.port = port;
	self.rconPassword = rconPassword;
}

Connection.prototype.__proto__ = EventEmitter.prototype;

Connection.prototype.connect = function (callback) {
	var self = this;

	// Create Connection
	self.connection = net.createConnection({ host: self.host, port: self.port });

	// When we are connected to RCON
	self.connection.on('connect', function() {
	    console.log("Connection created", self.host, self.port);

		// Authenticate RCON password
		var reqId = self.request(self.rconPassword, "SERVERDATA_AUTH");

		// Register Event Listeners for the SERVERDATA_AUTH request.
		self.once('-1', function(data) {
            self.removeAllListeners('1');
            // cb.call(self, {code: 'WRONG_PASSWORD'});
            console.log("wrong password");
        });

        self.once(reqId, function(res) {
            self.removeAllListeners('-1');
            // cb.call(self);
            console.log("rcon password accepted");
            callback();
        });
	});

	self.connection.on('error', function(err) {
	    console.log('TCP connection error', err);
	});

	// Whenever we recieve data from the server emit an event using it's id field.
	// Request id and Response id are the same.
	self.connection.on('data', function(data) {
	    var res = new Response(data);
	    console.log(res);

	    self.emit(res.id.toString(10), res);
	});
};

Connection.prototype.exec = function (command, callback) {
	var self = this;

	var reqId = self.request(command);
	var ackId = self.request('', 'SERVERDATA_RESPONSE_VALUE');

	// Start listening for receieved packets for reqId
	self.on(reqId, packetSave);

	// When this event is triggered, we can safely assume first request's repsonse has been fully recieved.
	self.once(ackId, function () {
		// dispose of listener
		self.removeListener(reqId, packetSave);
		
		// dequeue response and return
		var res = self.queue[reqId];
		delete self.queue[reqId];
		callback(res);
	});

	function packetSave(req) {
		// Save all packets from the response
		if (self.queue[reqId]) {
            return self.queue[reqId] += req.body;
        }

        self.queue[reqId] = req.body;
	}
}

Connection.prototype.request = function (content, type, id) {
	var self = this;

	var id = id || self.getNextPacketId();

	var request = new Request({
		id: id,
		type: type || 'SERVERDATA_EXECCOMMAND',
		body: content
	});

  	// console.log(request);

	self.connection.write(request.buffer, function (err) {
		if (err) {

		}
		console.log("sent packet", id);
	});

  return id.toString(10);
}


Connection.prototype.getNextPacketId = function() {
	var self = this;

    return self.packetId += 1;
};
	
module.exports = Connection;