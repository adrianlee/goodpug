var jade = require('jade');
var express = require('express');
var app = express();
var session = require('express-session');
var RedisStore = require('connect-redis')(session);
var passport = require('passport');
var SteamStrategy = require('passport-steam').Strategy;
var steam = require('steamidconvert')();
var mongoose = require('mongoose');
var logger = require('morgan');
var db = mongoose.connect('mongodb://goodpug:goodpug@widmore.mongohq.com:10010/pillbox', { server: { auto_reconnect: true } });

// db.on('connecting', function() {
//   console.log('connecting to MongoDB...');
// });

// db.on('error', function(error) {
//   console.error('Error in MongoDb connection: ' + error);
//   mongoose.disconnect();
// });
// db.on('connected', function() {
//   console.log('MongoDB connected!');
// });
// db.once('open', function() {
//   console.log('MongoDB connection opened!');
// });
// db.on('reconnected', function () {
//   console.log('MongoDB reconnected!');
// });
// db.on('disconnected', function() {
//   console.log('MongoDB disconnected!');
//   mongoose.connect(dbURI, {server:{auto_reconnect:true}});
// });
// mongoose.connect(dbURI, {server:{auto_reconnect:true}});

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

// set jade templating
app.set('views', __dirname + '/views')
app.set('view engine', 'jade')

// set directory for static files
app.use(express.static(__dirname + '/public'));

app.use(logger('dev'));

// session
// app.use(session({
//   secret: 'keyboard cat',
//   resave: false,
//   saveUninitialized: true
// }));

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

passport.use(new SteamStrategy({
    returnURL: 'http://localhost:3000/auth/steam/callback',
    realm: 'http://localhost:3000/',
    apiKey: '20087C97D27C353C48D3EB5CBF8F7B19'
  },
  function(identifier, profile, done) {
    // User.findByOpenID({ openId: identifier }, function (err, user) {
    //   return done(err, user);
    // });

    console.log(profile);

    if (!profile)
      return done("No profile returned");

    var newProfile = {
      id: profile.id,
      displayName: profile.displayName,
      steamId: profile.id && steam.convertToText(profile.id),
      profileUrl: profile._json.profileurl,
      avatarSmall: profile.photos && profile.photos[0] && profile.photos[0].value,
      avatarMedium: profile.photos && profile.photos[1] && profile.photos[1].value,
      avatarBig: profile.photos && profile.photos[2] && profile.photos[2].value
    };

    Player.findOneAndUpdate({ id: profile.id }, newProfile, { upsert: true }, function (err, doc) {
      console.log(doc);
      done(err, doc);
    });
  }
));

passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(obj, done) {
  done(null, obj);
});

// site routes
app.get('/', function (req, res) {
  if (req.isAuthenticated()) {

    var data = req.user;
    data.steamid = steam.convertToText(req.user && req.user.id) || "";

    return res.render('pugs', {});
  }
  res.render('index');
});

app.get('/lobby/:id', ensureAuthenticated, function (req, res) {
  res.render('lobby', req.params);
});

app.get('/admin', ensureAuthenticated, function (req, res) {
  Player.find({}, function (err, docs) {
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

// Simple route middleware to ensure user is authenticated.
//   Use this route middleware on any resource that needs to be protected.  If
//   the request is authenticated (typically via a persistent login session),
//   the request will proceed.  Otherwise, the user will be redirected to the
//   login page.
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }

  res.redirect('/');
}

var server = app.listen(3000, function () {
  var host = server.address().address
  var port = server.address().port

  console.log('Example app listening at http://%s:%s', host, port)
});