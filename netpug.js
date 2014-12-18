
var Connection = require("./connection");

var rcon = new Connection("104.236.164.175", "27015", "123");

rcon.connect(function (err) {
	if (err) {
		return console.log("Failed to connect to server");
	}

	// After connection

	rcon.exec("status", function (res) {
		console.log(res);
	});

	// rcon.exec("cvarlist", function (res) {
	// 	console.log(res);
	// });
});


var dgram = require('dgram'),
    server = dgram.createSocket('udp4');

server.on('message', function (message, rinfo) {
	var msg = message.toString('ascii').slice(5,-1);    
	console.log(msg);
});

server.on('listening', function () {
    var address = server.address();
    console.log('UDP Server listening ' + address.address + ':' + address.port);
});

server.on("error", function (err) {
  console.log("server error:\n" + err.stack);
  server.close();
});

server.on("close", function () {
  console.log("closed");
});

server.bind(8006);  