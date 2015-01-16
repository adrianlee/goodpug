var dgram = require('dgram'),
    server = dgram.createSocket('udp4');

var port = "8007";

server.on('message', function (message, rinfo) {
  console.log(rinfo)  
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

server.bind(port);