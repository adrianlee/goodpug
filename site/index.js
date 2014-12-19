var jade = require('jade');
var express = require('express');
var app = express();
var session = require('express-session')
var passport = require('passport');
var SteamStrategy = require('passport-steam').Strategy;
var steam = require('steamidconvert')();

// set jade templating
app.set('views', __dirname + '/views')
app.set('view engine', 'jade')

// set directory for static files
app.use(express.static(__dirname + '/public'));

// session
app.use(session({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: true
}));

// passport configure
app.use(passport.initialize());
app.use(passport.session());

passport.use(new SteamStrategy({
    returnURL: 'http://localhost:3000/auth/steam/callback',
    realm: 'http://localhost:3000/',
    apiKey: '20087C97D27C353C48D3EB5CBF8F7B19'
  },
  function(identifier, profile, done) {
    // User.findByOpenID({ openId: identifier }, function (err, user) {
    //   return done(err, user);
    // });

    done(null, profile);
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

    return res.render('pugs', data);
  }
  res.render('index');
});

app.get('/lobby/:id', function (req, res) {
  res.render('lobby', req.params);
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