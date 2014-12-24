var jade = require('jade');
var express = require('express');
var session = require('express-session');
var RedisStore = require('connect-redis')(session);
var passport = require('passport');
var logger = require('morgan');
var _ = require("lodash");
var app = express();

var db = require("./database");
var passportInit = require("./passport");

var Server = require("./lib/Server");
var ServerManager = require("./lib/ServerManager");
var PlayerManager = require("./lib/PlayerManager");

// set jade templating
app.set('views', __dirname + '/views')
app.set('view engine', 'jade')

// import server-side libraries for front-end use.
app.locals.moment = require('moment');
app.locals.lodash = require('lodash');

// set directory for static files
app.use(express.static(__dirname + '/public'));

// set logging level
app.use(logger('dev'));

// session
app.use(session({
    store: new RedisStore({
      host: "pub-redis-16323.us-east-1-2.4.ec2.garantiadata.com",
      port: "16323",
      pass: 123123123
    }),
    secret: 'keyboard catz',
    resave: false,
    saveUninitialized: true,
}));

// passport configure
app.use(passport.initialize());
app.use(passport.session());

// middleware
app.use(function (req, res, next) {
  res.locals.user = req.user;

  // set isAdmin flag for jun
  if (req.user && req.user.id == "76561197961790405")
    res.locals.isAdmin = true;

  next();
});

app.use(function (req, res, next) {
  if (!req.session) {
    return next(new Error('Session service is down'));
  }
  
  next()
})

// site routes
app.get('/', function (req, res) {
  if (req.isAuthenticated()) {

    var data = req.user;

    return res.render('home', ServerManager);
  }
  res.render('welcome');
});

app.get('/r/:roomid', ensureAuthenticated, function (req, res) {
  if (!ServerManager.getServer(req.params.roomid)) {
    return res.send("Room not found");
  }

  res.render('room', ServerManager.getServer(req.params.roomid));
});

app.get('/admin', ensureAuthenticated, function (req, res) {
  db.Player.find({}, function (err, docs) {
    if (err)
      return;

    res.locals.playerList = docs;
    res.render('admin');
  });
});

app.get('/profile', ensureAuthenticated, function (req, res) {
  res.render('profile');
});

app.get('/auth/steam',
  passport.authenticate('steam'),
  function(req, res){
    // The request will be redirected to Steam for authentication, so
    // this function will not be called.
  });

app.get('/auth/steam/callback',
  passport.authenticate('steam', { failureRedirect: '/' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/');
  });

app.get('/logout', function(req, res){
  req.logout();
  res.redirect('/');
});

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }

  res.redirect('/');
}

var server = app.listen(3000, function() {
  var host = server.address().address
  var port = server.address().port

  console.log('Goodpug started: http://%s:%s', host, port)
});

// Populate server
ServerManager.servers["San Francisco 1"] = new Server({ name: "San Francisco 1" });

// socket.io
var io = require('socket.io').listen(server);

io.on('connection', function(socket) {
  // when a user joins a room
  socket.on('join room', function(data) {
    // check if server exists
    if (!ServerManager.getServer(data.room)) {
      console.error("Unable to find room");
      return;
    }

    // check server status to see if we can join
    // if (servers[data.room].status > 1) {
    //   return;
    // }

    var payload = {
      displayName: data.displayName,
      id: data.id,
      ready: false
    };

    // Remove player from existing room.
    var playerLastRoom = PlayerManager.players[data.id];
    if (!!playerLastRoom) {
      var room = ServerManager.getServer(playerLastRoom);
      delete room.players[data.id];
    }

    // Join socket.io room
    console.log(data, "joined the room");
    socket.currentRoom = data.room;
    socket.playerId = data.id;
    socket.join(data.room);

    // Add player to server player list
    ServerManager.getServer(socket.currentRoom).players[data.id] = payload;

    // Set the current room this player is in
    PlayerManager.players[socket.playerId] = data.room;

    io.sockets.to(data.room).emit("player joined", payload);

    socket.updateRoomInfo();
  });

  socket.on('player ready', function() {
    console.log(socket.playerId, "is ready");
    var readyCount = 0; 
    var server = ServerManager.getServer(socket.currentRoom);

    if (!server) {
      return console.log("User is not in a Room");
    }

    if (!server.playerReady(socket.playerId))
      return console.log("User not found");

    socket.updateRoomInfo();

    for (var player in server.players)
    {
      if (player.ready){
        ++readyCount;
      } else {
        return;
      }
    }
    if (readyCount == 10) {
      // socket.updateRoomInfo();
      console.log("all players ready!")      
    }
  });

  socket.on('disconnect', function() {
    // Remove user from Server
    var server = ServerManager.getServer(socket.currentRoom);

    if (!server) return;

    server.removePlayer(socket.playerId);

    // Remove user from PlayerManager
    PlayerManager.removePlayer(socket.playerId);

    // Broadcast player leave event to room
    io.sockets.to(socket.currentRoom).emit("player left", socket.playerId);

    // Broadcast room update
    socket.updateRoomInfo();
  });

  socket.updateRoomInfo = function() {
    var server = ServerManager.getServer(socket.currentRoom);
    
    if (!server) return;

    var info = {};
    info.players = server.players;
    info.playerCount = server.playerCount();
    info.ready = server.isReady();

    io.sockets.to(socket.currentRoom).emit("room update", info);
  }
});