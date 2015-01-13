module.exports = Server;

var states = ["waiting", "live", "ended"];

function Match(options) {
    // init
    this.status = states[0];
    this.players = options.players;
    this.rankAverage = null;

    // score
    this.score = null;
}

Match.prototype.getStatus = function() {
    return this.status;
}

Match.prototype.calculateRankAverage = function() {
    // return this.status;
}