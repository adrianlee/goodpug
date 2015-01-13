var Server = require('./lib/server');
var servers = [];
var server = new Server();
/*
1. get a list of servers from mongo
2. create a new Server object for each server
3. start log listener for each
4. exec rcon to get state of server, 
*/
/* server properties

status: live, empty, warm up
players: []
team a: []
team b: []
match score:
average rank

*/
/* server methods

restart()
exec(config)
warmup(start/end)
setPassword(random)
getPassword()
getPlayers()
averageRank()

*/