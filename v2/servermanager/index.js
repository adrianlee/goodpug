var config = require("../config");
// redis
var redis = require('redis');
var r = redis.createClient(config.redis.port, config.redis.host, {
    auth_pass: config.redis.pass
});
// log reader
var dgram = require('dgram')
var server = dgram.createSocket('udp4');
server.on('message', function(message, rinfo) {
    var msg = message.toString('ascii').slice(5, -1);
    getMatchId(rinfo, function(matchId) {
        console.log("new log for", msg);
        parseMessage(msg, matchId);
    });
});
server.on('listening', function() {
    var address = server.address();
    console.log('UDP Server listening ' + address.address + ':' + address.port);
});
server.on("error", function(err) {
    console.log("server error:\n" + err.stack);
    // server.close();
});
server.on("close", function() {
    console.log("closed");
});
server.bind(5000);
// patterns
var pKill = new RegExp('^"(.+)[<](\\d+)[>][<](.*)[>][<](CT|TERRORIST|Unassigned|Spectator)[>]" \\[([\\-]?[0-9]+) ([\\-]?[0-9]+) ([\\-]?[0-9]+)\\] killed "(.+)[<](\\d+)[>][<](.*)[>][<](CT|TERRORIST|Unassigned|Spectator)[>]" \\[([\\-]?[0-9]+) ([\\-]?[0-9]+) ([\\-]?[0-9]+)\\] with "([a-zA-Z0-9_]+)"(.*)');
var pKillAssist = new RegExp('^"(.+)[<](\\d+)[>][<](.*)[>][<](CT|TERRORIST|Unassigned|Spectator)[>]" assisted killing "(.+)[<](\\d+)[>][<](.*)[>][<](CT|TERRORIST|Unassigned|Spectator)[>]"');
var pConnected = new RegExp('^"(.+)[<](\\d+)[>][<](.*)[>][<][>]" connected, address "(.*)"');
var pDisconnected = new RegExp('^"(.+)[<](\\d+)[>][<](.*)[>][<](CT|TERRORIST|Unassigned|Spectator)[>]" disconnected');
var pEnteredGame = new RegExp('/^"(.+)[<](\\d+)[>][<](.*)[>][<][>]" entered the game/');
var pJoinedTeam = new RegExp('^"(.+)[<](\\d+)[>][<](.*)[>][<](CT|TERRORIST|Unassigned|Spectator)[>]" joined team "(CT|TERRORIST|Unassigned|Spectator)"');
var pRoundStart = new RegExp('^World triggered "Round_Start"');
var pRoundEnd = new RegExp('^World triggered "Round_End"');
var pRoundRestart = new RegExp('!World triggered "Restart_Round_\\((\\d+)_(second|seconds)\\)"!');
var pRoundScore = new RegExp('^Team "(.*)" triggered "SFUI_Notice_(Terrorists_Win|CTs_Win|Target_Bombed|Target_Saved|Bomb_Defused)');
var pSay = new RegExp('^"(.+)[<](\\d+)[>][<](.*)[>][<](CT|TERRORIST|Unassigned|Spectator)[>]" say "(.*)"');
var pSayTeam = new RegExp('^"(.+)[<](\\d+)[>][<](.*)[>][<](CT|TERRORIST|Unassigned|Spectator)[>]" say_team "(.*)"');
var pSwitchTeam = new RegExp('^"(.+)[<](\\d+)[>][<](.*)[>]" switched from team [<](CT|TERRORIST|Unassigned|Spectator)[>] to [<](CT|TERRORIST|Unassigned|Spectator)[>]');
var pScored = new RegExp('^Team "(CT|TERRORIST)" scored "(\\d+)" with "(\\d+)" players');
var pMapChanged = new RegExp('^Started map "(.*)" (.*)');
// fetch match id and cache
var matchIdCache = {};

function getMatchId(rinfo, callback) {
    if (matchIdCache[rinfo.address + ":" + rinfo.port]) {
        callback(matchIdCache[rinfo.address + ":" + rinfo.port].id);
        return;
    }
    r.get("server:" + rinfo.address + ":" + rinfo.port, function(err, matchId) {
        if (!matchId) {
            callback();
            return;
        }
        // expire 1 minute
        matchIdCache[rinfo.address + ":" + rinfo.port] = {
            id: matchId,
            expire: new Date(date.getTime() + 60000).getTime()
        };
        callback(matchId)
    });
};
// log parser
function parseMessage(msg, matchId) {
    console.log(matchId);
    var split = msg.split(": ");
    var timestamp = split[0];
    var log = split[1];
    var extra = split[2];
    var res;
    // console.log(log, extra);
    // test patterns
    if (pKill.test(log)) {
        res = pKill.exec(log);
        console.log(res);
        // name, userid, steamid, team, location_x, location_y, location_z, name, userid, steamid, team, location_x, location_y, location_z, weapon, headshot
        // r.set("server:" + rinfo.address + ":" rinfo.port, "")
        // r.set("match")
        if (matchId) {
            r.hincrby("match:" + matchId + ":" + kills, res[4] /*steamid*/ , 1);
            r.hincrby("match:" + matchId + ":" + deaths, res[11] /*steamid*/ , 1);
        }
    } else if (pKillAssist.test(log)) {
        res = pKillAssist.exec(log);
        console.log(res);
        if (matchId) {
            r.hincrby("match:" + matchId + ":" + assists, res[4] /*steamid*/ , 1);
        }
    } else if (pConnected.test(log)) {
        res = pConnected.exec(log);
        console.log(res);
    } else if (pDisconnected.test(log)) {
        res = pDisconnected.exec(log);
        console.log(res);
    } else if (pEnteredGame.test(log)) {
        res = pEnteredGame.exec(log);
        console.log(res);
    } else if (pJoinedTeam.test(log)) {
        res = pJoinedTeam.exec(log);
        console.log(res);
        if (matchId) {
            r.hincrby("match:" + matchId + ":" + team, res[4] /*steamid*/ , res[6] /*newteam*/ );
            r.rpush("match:" + matchId + ":logs", res.input);
        }
    } else if (pRoundStart.test(log)) {
        res = pRoundStart.exec(log);
        console.log(res);
    } else if (pRoundEnd.test(log)) {
        res = pRoundEnd.exec(log);
        console.log(res);
    } else if (pRoundScore.test(log)) {
        res = pRoundScore.exec(log);
        console.log(res);
    } else if (pSay.test(log)) {
        res = pSay.exec(log);
        console.log(res);
        if (matchId) {
            r.rpush("match:" + matchId + ":logs", res.input);
        }
    } else if (pSayTeam.test(log)) {
        res = pSayTeam.exec(log);
        console.log(res);
        if (matchId) {
            r.rpush("match:" + matchId + ":logs", res.input);
        }
    } else if (pSwitchTeam.test(log)) {
        res = pSwitchTeam.exec(log);
        console.log(res);
        if (matchId) {
            r.hset("match:" + matchId + ":" + team, res[4] /*steamid*/ , res[6] /*newteam*/);
            r.rpush("match:" + matchId + ":logs", res.input);
        }
    } else if (pScored.test(log)) {
        res = pScored.exec(log);
        console.log(res);
        if (matchId) {
            r.hset("match:" + matchId + ":score", res[2], res[3]);
        }
    } else if (pMapChanged.test(log)) {
        res = pMapChanged.exec(log);
        console.log(res);
        if (matchId) {
            r.hset("match:" + matchId + ":map", res[2]);
        }
    }
};
// LOG EXAMPLES
/*
// WORLD
World triggered "Game_Commencing"
World triggered "Round_Start"
World triggered "Round_End"
World triggered "Restart_Round_(1_second)"

// CONNECTION
"Jeff<23><BOT><>" connected, address ""
"jun<2><STEAM_1:1:762338><>" entered the game
"Jim<5><BOT><TERRORIST>" disconnected (reason "Kicked by Console")

// TRIGGERS
"Orin<31><BOT><TERRORIST>" triggered "Got_The_Bomb"
"Chad<22><BOT><TERRORIST>" triggered "Planted_The_Bomb"
"jun<22><STEAM_1:1:762338><CT>" triggered "Begin_Bomb_Defuse_With_Kit"
"jun<22><STEAM_1:1:762338><CT>" triggered "Defused_The_Bomb"

"Elmer<17><BOT><CT>" purchased "deagle"
"Mark<28><BOT><CT>" threw hegrenade [833 1434 -71]

// TEAM
"jun<2><STEAM_1:1:762338><TERRORIST>" triggered "clantag" (value "")
"jun<2><STEAM_1:1:762338><CT>" triggered "clantag" (value "")

"Ivan<8><BOT>" switched from team <TERRORIST> to <CT>
"Vinny<3><BOT>" switched from team <Unassigned> to <CT>
"jun<2><STEAM_1:1:762338>" switched from team <CT> to <Spectator>

// KILL
"Ulric<16><BOT><TERRORIST>" [-1968 2067 14] killed "Oliver<13><BOT><CT>" [-1371 2557 51] with "ump45"
"Bob<14><BOT><TERRORIST>" [1371 2296 12] killed "Frasier<20><BOT><CT>" [1224 2071 78] with "sg556" (headshot)
L 01/21/2015 - 21:47:49: "Bert<19><BOT><CT>" [-1932 1332 32] killed "Ulric<16><BOT><TERRORIST>" [-1690 1113 96] with "mag7"
L 01/21/2015 - 21:45:14: "jun<2><STEAM_1:1:762338>" switched from team <CT> to <Spectator>

"Ian<25><BOT><TERRORIST>" assisted killing "Keith<24><BOT><CT>"
"jun<2><STEAM_1:1:762338><CT>" [-47 1391 -22] committed suicide with "world"

// SCORE
Team "TERRORIST" triggered "SFUI_Notice_Target_Bombed" (CT "0") (T "1")
Team "TERRORIST" triggered "SFUI_Notice_Target_Bombed" (CT "1") (T "1")
Team "TERRORIST" triggered "SFUI_Notice_Terrorists_Win" (CT "0") (T "1")
Team "CT" triggered "SFUI_Notice_Bomb_Defused" (CT "1") (T "1")

Team "CT" scored "0" with "5" players
Team "TERRORIST" scored "0" with "5" players
Team "CT" scored "0" with "5" players
Team "TERRORIST" scored "1" with "5" players
*/