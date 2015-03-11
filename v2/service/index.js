var config = require("../config");
// API
var express = require('express');
var app = express();
// body parse configuration
var bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: false
}));
// routes
app.all('*', function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    res.header('Access-Control-Allow-Methods', 'POST, GET, PUT, DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
});
// servers
app.get('/servers', function(req, res) {
    broker.getPugs(function(err, servers) {
        if (err) return res.sendStatus(500);
        if (!servers) return res.sendStatus(404);
        res.send(servers);
    });
});
app.post('/servers', function(req, res) {
    broker.createPug(req.body, function(err, server) {
        if (err) return res.send(500, err);
        if (!server) return res.sendStatus(404);
        res.send(server);
    });
});
app.get('/servers/:id', function(req, res) {
    broker.getServerById(req.params.id, function(err, server) {
        if (err) return res.send(500, err);
        if (!server) return res.sendStatus(404);
        res.send(server);
    });
});
app.delete('/servers/:id', function(req, res) {
    broker.removePug(req.params.id, function(err, server) {
        if (err) return res.send(500, err);
        if (!server) return res.sendStatus(404);
        res.send(server);
    });
});
// matches
app.get('/matches', function(req, res) {
    broker.getMatchList(function(err, matches) {
        if (err) return res.send(500, err);
        if (!matches) return res.sendStatus(404);
        res.send(matches);
    });
});
app.get('/matches/:id', function(req, res) {
    broker.getMatch(req.params.id, function(err, match) {
        if (err) return res.send(500, err);
        if (!match) return res.sendStatus(404);
        res.send(match);
    });
});
// players
app.get('/players', function(req, res) {
    broker.getPlayers(function(err, players) {
        if (err) return res.sendStatus(500);
        if (!players) return res.sendStatus(404);
        res.send(players);
    });
});
app.get('/players/:id', function(req, res) {
    broker.getPlayer(req.params.id, function(err, player) {
        if (err) return res.sendStatus(500);
        if (!player) return res.sendStatus(404);
        res.send(player);
    });
});
// server command
app.get('/refresh', function(req, res) {
    broker.refreshPugList(function(err, list) {
        if (err) return res.send(500, err);
        res.send(true);
    });
});
// authenticated call
app.get('/resetMatchStatus/:sid', function(req, res) {
    broker.resetMatchStatus(req.params && req.params.sid, function(err, list) {
        if (err) return res.send(404, err);
        res.send(true)
    });
});
var server = app.listen(config.service.port);
// WEBSOCKET
// var ws = require("./websocket")(server);
// BROKER
var broker = require('./broker');
broker.init();
broker.refreshPugList();