let Connection = require('../Connection');
const LobbyState = require('../utilities/lobbyState');

module.exports = class BaseLobby {

    lobbyState = LobbyState;

    constructor(id) {
        this.id = id;
        this.name = "Default Lobby";
        this.connections = [];
        this.lobbyState = new LobbyState();
        this.lobbyState.currentState = this.lobbyState.BASE;
    }

    onUpdate() {

    }

    onEnterLobby(connection = Connection) {

        let player = connection.player;
        console.log('[' + new Date(Date.now()) + '] Player ' + player.getPlayerInformation() + ' has entered lobby (' + this.name + ':' + this.id + ')');
        this.connections.push(connection);
        player.lobby = this.id;
        connection.lobby = this;
    }

    onLeaveLobby(connection = Connection) {
        let player = connection.player;

        console.log('[' + new Date(Date.now()) + '] Player ' + player.getPlayerInformation() + ' has left the lobby (' + this.name + ':' + this.id + ')');

        connection.lobby = undefined;

        let index = this.connections.indexOf(connection);
        if (index > -1) {
            this.connections.splice(index, 1);
        }

    }
}