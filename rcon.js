var Rcon = require('srcds-rcon');

var rcon = new Rcon('104.236.164.175:27015', '123');

rcon.connect(function() {
    // rcon.sv_airaccelerate(6, function(err, res) {
    //     console.log('sv_airaccelerate set to 6', res);
    //     rcon.changelevel('de_dust2', function(err, res) {
    //         console.log('Changed map to de_dust2');
    //     });
    // });
});