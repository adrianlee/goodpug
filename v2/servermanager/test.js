var log = '/^Team "(?P<team>CT|TERRORIST)" scored "(?P<score>\\d+)" with "(?P<players>\\d+)" players/';

var keys = [];
var re = require("pcre-to-regexp")(log, keys);

console.log(re);

var match = re.exec('"Ian<25><BOT><TERRORIST>" assisted killing "Keith<24><BOT><CT>"');

console.log(match);