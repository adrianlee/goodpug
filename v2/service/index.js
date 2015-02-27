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
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
});
// pugs
app.get('/pugs', function(req, res) {
    broker.getPugs(function(err, pug) {
        if (err) return res.sendStatus(500);
        if (!pug) return res.sendStatus(404);
        res.send(pug);
    });
});
app.get('/pug/:id', function(req, res) {
    broker.getPug(req.params.id, function(err, pug) {
        if (err) return res.sendStatus(500);
        if (!pug) return res.sendStatus(404);
        res.send(pug);
    });
});
app.post('/pug', function(req, res) {
    if (req.body) {
        broker.createPug(req.body, function(err, pug) {
            if (err) return res.sendStatus(500);
            if (!pug) return res.sendStatus(404);
            res.send(pug);
        });
    }
});
// matches
app.get('/match', function(req, res) {
    broker.getMatchList(function (err, list) {
        if (err) return res.sendStatus(500);
        if (!list) return res.sendStatus(404);
        res.send(list);
    });
});
app.get('/match/:id', function(req, res) {
    broker.getMatch(req.params.id, function (err, match) {
        if (err) return res.sendStatus(500);
        if (!match) return res.sendStatus(404);
        res.send(match);
    });
});
// server command
app.get('/refresh', function(req, res) {
    broker.refreshPugList(function (err, list) {
      if (err) return res.send(500, err);
      res.send(true)
    });
});
// authenticated call
app.get('/resetMatchStatus/:sid', function(req, res) {
    broker.resetMatchStatus(req.params && req.params.sid, function (err, list) {
      if (err) return res.send(404, err);
      res.send(true)
    });
});
var server = app.listen(config.service.port);
// WEBSOCKET
var ws = require("./websocket")(server);
// BROKER
var broker = require('./broker');
broker.init();
broker.refreshPugList();