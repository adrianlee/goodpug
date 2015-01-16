var Gamedig = require('gamedig');
Gamedig.query(
    {
        type: 'csgo',
        host: '104.236.164.175:27015'
    },
    function(state) {
        if(state.error) console.log("Server is offline");
        else console.log(state);
    }
);