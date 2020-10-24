module.exports = class GameletLobbySettings {

    constructor(gameMode = Text, maxPlayers = Number) {
        this.gameMode = gameMode;
        this.maxPlayers = maxPlayers;
    }
}