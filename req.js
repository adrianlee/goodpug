var Request = require("./socket/request");
var Response = require("./socket/response");

var packetId = 0;

function Req(content, type, id) {
  var self = this;

  var id = id || getNextPacketId();

  var buffer = new Request({
   id: id,
   type: type || Request.SERVERDATA_AUTH,
   body: content
  }).buffer;

  return id.toString(10);
}


var getNextPacketId = function() {
    return packetId += 1;
};

module.exports = Req;