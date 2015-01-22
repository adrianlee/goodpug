// log reader
var dgram = require('dgram')
var server = dgram.createSocket('udp4');
server.on('message', function(message, rinfo) {
    var msg = message.toString('ascii').slice(5, -1);
    parseMessage(rinfo, msg);
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
// log parser
function parseMessage(rinfo, msg) {
    console.log(rinfo.address, rinfo.port);
    var split = msg.split(": ");
    var timestamp = split[0];
    var log = split[1];
    var extra = split[2];
    console.log(log, extra);
}

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