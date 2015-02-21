var config = require("../config");
var db = require('./database');
var async = require("async");
// express app init
var express = require('express');
var app = express();
// body parse configuration
var bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: false
}));
// logger configuration
var logger = require('morgan');
app.use(logger('dev'));
// session configuration
var session = require('express-session');
var RedisStore = require('connect-redis')(session);
app.use(session({
    store: new RedisStore({
        host: config.redis.host,
        port: config.redis.port,
        pass: config.redis.pass
    }),
    secret: config.express.sessionSecret,
    resave: false,
    saveUninitialized: true,
}));
// auth configuration
var passport = require('passport');
var passportInit = require("./passport");
app.use(passport.initialize());
app.use(passport.session());
app.get('/auth/steam', passport.authenticate('steam'), function(req, res) {
    // The request will be redirected to Steam for authentication, so
    // this function will not be called.
});
app.get('/auth/steam/callback', passport.authenticate('steam', {
    failureRedirect: '/'
}), function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/');
});
app.get('/logout', function(req, res) {
    req.logout();
    res.redirect('/');
});
// routes
app.all('*', function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
});
app.get('/profile', ensureAuthenticated, function(req, res) {
    res.send(req.user);
});
app.get('/profile/:id', ensureAuthenticated, function(req, res) {
    if (!req.params.id) {
        return res.sendStatus(404);
    }
    db.Player.findOne({
        id: req.params.id
    }, function(err, profile) {
        if (err) return res.sendStatus(500);
        if (!profile) {
            return res.sendStatus(404);
        }
        res.send(profile);
    });
});
app.get('/admin', ensureAuthenticated, function(req, res) {
    if (!req.isAdmin) {
        res.sendStatus(403);
        return;
    }
    var fetchPlayers = function(callback) {
        db.Player.find({}, function(err, docs) {
            callback(err, docs);
        });
    };
    var fetchServers = function(callback) {
        db.Server.find({}, function(err, docs) {
            callback(err, docs);
        });
    }
    async.parallel({
        players: fetchPlayers,
        servers: fetchServers
    }, function(err, results) {
        res.send(results);
    });
});
// static files
app.use(express.static(__dirname + '/public'));
app.get('/', function(req, res) {
    if (req.isAuthenticated()) {
        var data = req.user;
        return res.sendFile(__dirname + "/public/home.html");
    }
    res.sendFile(__dirname + "/public/welcome.html");
});
// helper functions
function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        if (req.user.id == "76561197961790405") {
            req.isAdmin = true;
        }
        return next();
    }
    res.send(401);
};
// start
app.listen(config.express.port);