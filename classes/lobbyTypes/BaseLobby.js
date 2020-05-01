let Connection = require('../Connection');

module.exports = class BaseLobby {
    constructor(id) {
        this.id = id;
        this.connections = [];
    }

    onUpdate() {

    }

    onEnterLobby(connection = Connection) {

        let player = connection.player;
        console.log('[' + new Date(Date.now()) + '] Player ' + player.getPlayerInformation() + ' has entered the lobby (' + this.id + ')');
        this.connections.push(connection);
        player.lobby = this.id;
        connection.lobby = this;
    }

    onLeaveLobby(connection = Connection) {
        let player = connection.player;

        console.log('[' + new Date(Date.now()) + '] Player ' + player.getPlayerInformation() + ' has left the lobby (' + this.id + ')');

        connection.lobby = undefined;

        let index = this.connections.indexOf(connection);
        if (index > -1) {
            this.connections.splice(index, 1);
        } else {
            console.log('ERROR, player not found.');
        }

    }
}