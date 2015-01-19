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
    // store: new RedisStore({
    //   host: "pub-redis-16323.us-east-1-2.4.ec2.garantiadata.com",
    //   port: "16323",
    //   pass: 123123123
    // }),
    store: new RedisStore({
        host: "bojap.com",
        port: "6379",
        pass: "01895v7nh10234985y19034v85vyb01945v8"
    }),
    secret: 'keyboard catz',
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
// static files
app.use(express.static(__dirname + '/public'));
// app.get('/', function(req, res) {
//     if (req.isAuthenticated()) {
//         var data = req.user;
//         return res.sendFile(__dirname + "/public/index.html");
//     }
//     res.sendFile(__dirname + "/public/welcome.html");
// });
app.use(function(req, res) {
    if (req.isAuthenticated()) {
        var data = req.user;
        return res.sendFile(__dirname + "/public/home.html");
    }
    res.sendFile(__dirname + "/public/welcome.html");
});
// helper functions
function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.send(401);
};
// start
app.listen(3000);