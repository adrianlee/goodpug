var express = require('express');
var app = express();

app.all('*', function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
});

app.get('/pugs', function(req, res) {
    var pugs = {};
    pugs["sfo1"] = {
        id: "n13957f1-095f-1057b-1gn3j",
        updated: new Date().getTime(),
        name: "San Francisco #1",
        ip: "192.168.0.1",
        port: "207015",
        location: "USWEST",
        players: [],
        status: 0
    };
    res.send(pugs);
});

app.get('/pug/:id', function(req, res) {
    var pugs = {};
    pugs["n13957f1-095f-1057b-1gn3j"] = {
        id: "n13957f1-095f-1057b-1gn3j",
        updated: new Date().getTime(),
        name: "San Francisco #1",
        ip: "192.168.0.1",
        port: "207015",
        location: "USWEST",
        players: [],
        status: 0
    };
    if (pugs[req.params.id]) {
      return res.send(pugs[req.params.id]);
    }

    res.sendStatus(404);
});

var server = app.listen(4000);
var ws = require("./websocket")(server);