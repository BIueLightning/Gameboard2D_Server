module.exports = class GameLobbySettings {

    constructor(gameMode = Text, maxPlayers = Number) {
        this.gameMode = gameMode;
        this.maxPlayers = maxPlayers;
    }
}