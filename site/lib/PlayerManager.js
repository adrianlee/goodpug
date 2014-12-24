module.exports = new PlayerManager;

function PlayerManager() {
	this.players = {};
}

PlayerManager.prototype.removePlayer = function (playerId) {
  if (this.players[playerId]) {
    delete this.players[playerId];
    return true;
  }
  return;
};