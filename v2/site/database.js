var config = require("../config");
// mongoose
var mongoose = require('mongoose');
// var mongoURI = "mongodb://goodpug:montreal123@ds050077.mongolab.com:50077/goodpug";
var mongoURI = config.mongodb.uri;

var db = mongoose.connection;

db.on('connecting', function() {
  console.log('connecting to MongoDB...');
});

db.on('error', function(error) {
  console.error('Error in MongoDb connection: ' + error);
  mongoose.disconnect();
});

db.on('connected', function() {
  console.log('MongoDB connected!');
});

db.once('open', function() {
  console.log('MongoDB connection opened!');
});

db.on('reconnected', function () {
  console.log('MongoDB reconnected!');
});

db.on('disconnected', function() {
  console.log('MongoDB disconnected!');
  mongoose.connect(mongoURI, { server: { auto_reconnect: true } });
});

mongoose.connect(mongoURI, { server: { auto_reconnect: true } });

var Player = mongoose.model('Player', {
  displayName: String,
  id: String,
  steamId: String,
  profileUrl: String,
  avatarSmall: String,
  avatarMedium: String,
  avatarBig: String,
  updated: { type: Date, default: Date.now }
});

var Server = mongoose.model('Server', {
  name: String,
  ip: String,
  port: String,
  rcon: String,
  location: { type: String, enum: ["USWEST", "USEAST", "USCENTRAL"] },
  updated: { type: Date, default: Date.now }
});

module.exports.mongoose = mongoose;
module.exports.Player = Player;
module.exports.Server = Server;