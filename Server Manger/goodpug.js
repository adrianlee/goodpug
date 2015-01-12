// var dgram = require('dgram');
// var message = new Buffer("Some bytes");
// var client = dgram.createSocket("udp4");
// client.send(message, 0, message.length, 27015, "104.236.164.175", function(err, bytes) {
//   client.close();
// });

// var Rcon = require('srcds-rcon');

// var rcon = new Rcon('104.236.164.175:27015', '123');

// rcon.connect(function() {
//     rcon.sv_airaccelerate(6, function(err, res) {
//         console.log('sv_airaccelerate set to 6', res);
//         rcon.changelevel('de_dust2', function(err, res) {
//             console.log('Changed map to de_dust2');
//         });
//     });
// });

var dgram = require('dgram');
var client = dgram.createSocket('udp4');

var createRequest = function(type, id, body) {
 
	var size   = Buffer.byteLength(body) + 14,
	    buffer = new Buffer(size);
 
	buffer.writeInt32LE(size - 4, 0);
	buffer.writeInt32LE(id, 4);
	buffer.writeInt32LE(type, 8);
	buffer.write(body, 12, size - 2, "ascii");
	buffer.writeInt16LE(0, size - 2);
 
	return buffer;
};
 
var readResponse = function(buffer) {
 
	var response = {
		size: buffer.readInt32LE(0),
		id:   buffer.readInt32LE(4),
		type: buffer.readInt32LE(8),
		body: buffer.toString("ascii", 12, buffer.length - 2)
	}
 
	return response;
};

client.on("error", function (err) {
  console.log("server error:\n" + err.stack);
  client.close();
});

client.on("listening", function () {
  var address = client.address();
  console.log("server listening " + address.address + ":" + address.port);

  var message = createRequest(3, 1, "123");

  client.send(message, 0, message.length, 27015, "104.236.164.175", function(err, bytes) {
		if (err) {
			console.log(err);
			client.close();
		}

		var message = Buffer(bytes);
		console.log(readResponse(message));
	});
});


client.on("message", function (msg, rinfo) {
  console.log("server got: " + msg + " from " + rinfo.address + ":" + rinfo.port);
});


client.bind(33333);





