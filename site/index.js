var jade = require('jade');
var express = require('express');
var session = require('express-session');
var RedisStore = require('connect-redis')(session);
var passport = require('passport');
var logger = require('morgan');
var _ = require("lodash");
var app = express();
var bodyParser = require('body-parser');

var async = require('async');

var db = require("./database");
var passportInit = require("./passport");

var Server = require("./lib/Server");
var ServerManager = require("./lib/ServerManager");
var PlayerManager = require("./lib/PlayerManager");

// set jade templating
app.set('views', __dirname + '/views')
app.set('view engine', 'jade')
app.disable('etag');

// import server-side libraries for front-end use.
app.locals.moment = require('moment');
app.locals.lodash = require('lodash');
app.locals.pretty = true;

// parse json body
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }))

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
  next();
})

// WELCOME OR HOME
app.get('/', function (req, res) {
  if (req.isAuthenticated()) {
    var data = req.user;

    return res.render('home', ServerManager);
  }

  res.render('welcome');
});

// LOBBY
app.get('/lobby/:id', ensureAuthenticated, function (req, res) {
  if (!ServerManager.getServer(req.params.id)) {
    return res.send("Room not found");
  }

  res.render('room', ServerManager.getServer(req.params.id));
});

// ADMIN PAGE
app.get('/admin', ensureAuthenticated, function (req, res) {
  var fetchPlayers = function (callback) {
    db.Player.find({}, function (err, docs) {
      callback(err, docs);
    });  
  };

  var fetchServers = function (callback) {
    db.Server.find({}, function (err, docs) {
      callback(err, docs);
    });  
  }
  
  async.parallel({
    players: fetchPlayers,
    servers: fetchServers
  }, function (err, results) {
    if (err) {
      //res.locals.errorMessage
    }

    res.locals.playerList = results.players || [];
    res.locals.serverList = results.servers || [];

    res.render('admin');
  });
});

// ADMIN GET SERVERS
app.get('/admin/server', ensureAuthenticated, function (req, res) {
  db.Server.find({}, function (err, docs) {
    callback(err, docs);
    res.send(docs);
  });
});

// ADMIN ADD SERVER
app.post('/admin/server', ensureAuthenticated, function (req, res) {
  var server = new db.Server(req.body);

  server.save(function (err, doc) {
    if (err)  return res.send(400, err);
    res.send(doc);
  });
});

// ADMIN REMOVE SERVER
app.delete('/admin/server', ensureAuthenticated, function (req, res) {
  console.log(req.body);
  db.Server.findOneAndRemove(req.body.id, function (err, doc) {
    if (err) return res.send(400, err);
    console.log(doc)
    res.send(doc);
  });  
});

// PROFILE ME
app.get('/profile', ensureAuthenticated, function (req, res) {
  res.render('profile');
});

// STEAM AUTH
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

// LOGOUT
app.get('/logout', function(req, res){
  req.logout();
  res.redirect('/');
});

// set directory for static files
app.use(express.static(__dirname + '/public'));

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
// ServerManager.servers["San Francisco 1"] = new Server({ name: "San Francisco 1" });

ServerManager.init();

// socket.io
var io = require('socket.io').listen(server);

var home = io.of('/home');

home.on('connection', function (socket) {
  console.log('IO /home');
  socket.on('servers', function (data) {
    console.log(ServerManager.getServerList());
    home.emit("servers", ServerManager.getServerList());
  });
});

var lobby = io.of('/lobby');

lobby.on('connection', function(socket) {
  console.log('IO /lobby');

  // when a user joins a room
  socket.on('join lobby', function(data) {
    var server = ServerManager.getServer(data.room);
    // check if server exists
    if (!server) {
      console.error("Unable to find room");
      return;
    }

    // Check server status to see if we can join
    if (server.status >= 1) {
      var data = {};
      data.id = server.id;
      data.status = server.status;
      data.name = server.name;
      data.location = server.location;
      data.ip = server.ip;
      data.port = server.port;

      socket.emit("live", data);
      return;
    }

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

    lobby.to(data.room).emit("player joined", payload);

    socket.updateRoomInfo();
  });

  // A player hit the ready button, set them as ready and increment the readyCount.
  // When there is 10, we emit the start match event to sockets a long with connection info.
  socket.on('player ready', function() {
    console.log(socket.playerId, "is ready");
    var readyCount = 0; 
    var server = ServerManager.getServer(socket.currentRoom);

    if (!server) {
      return console.log("User is not in a Room");
    }

    // set player as ready
    if (!server.playerReady(socket.playerId))
      return console.log("User not found");

    socket.updateRoomInfo();

    for (var player in server.players)
    {
      if (server.getPlayer(player) && server.getPlayer(player).ready) {
        ++readyCount;
      } else {
        console.log("oops");
        return;
      }
    }


    // Send match info when all are ready
    // TOOD set to equals only in case more than 10
    if (readyCount >= server.READYLIMIT) {
      // socket.updateRoomInfo();
      console.info("all players ready!");

      server.status = 1;

      socket.updateRoomInfo();
      lobby.to(socket.currentRoom).emit("start match", server.getConnectionInfo());
    } else {
      console.info(readyCount, "players are ready");
    }
  });

  socket.on('disconnect', function() {
    // Remove user from Server
    var server = ServerManager.getServer(socket.currentRoom);

    if (!server) return;

    server.removePlayer(socket.playerId);

    // Remove user from PlayerManager
    PlayerManager.removePlayer(socket.playerId);

    // Reset ready property for users
    server.playerReadyReset();

    // Broadcast player leave event to room
    lobby.to(socket.currentRoom).emit("player left", socket.playerId);

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
    info.status = server.status;

    lobby.to(socket.currentRoom).emit("lobby update", info);

    // update server list
    home.emit("servers", ServerManager.getServerList());
  }
});


process.on('uncaughtException', function(err) {
    // handle the error safely
    console.log(err);
});