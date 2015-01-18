var Connection = require("./lib/connection");
var rcon = new Connection("104.236.164.175", "27015", "123");

var ip = "76.104.160.191";
var port = "8007";

rcon.connect(function (err) {
	if (err) {
		return console.log("Failed to connect to server");
	}

	// After connection

  rcon.exec("log on", function (res) {
    // console.log(res);
    rcon.exec("logaddress_delall", function (res) {
      // console.log(res);
      rcon.exec("logaddress_add " + ip + ":" + port, function (res) {
        rcon.exec("users", function (res) {
          console.log(res);
        });
    	});
    });
  });
});

