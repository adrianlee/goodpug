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
app.get('/refresh', function(req, res) {
    broker.refreshPugList(function (err, list) {
      if (err) return res.send(500, err);
      res.send(true)
    });
});
var server = app.listen(4000);
// WEBSOCKET
var ws = require("./websocket")(server);
// BROKER
var broker = require('./broker');
broker.init();
broker.refreshPugList();