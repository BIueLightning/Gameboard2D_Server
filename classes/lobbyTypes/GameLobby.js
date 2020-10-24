const BaseLobby = require('./BaseLobby');
const GameLobbySettings = require('./GameLobbySettings');
const Connection = require('../Connection');
const LobbyState = require('../utilities/lobbyState');

/*
 * A general model for Lobbies that manage Games, containing functionality to manage
 * the lobby before start of the game (max connections, ready checks, synchronous game start,...).
 * For related general features you can extend this class directly.
 * Game functionality should be implemented in a subclass extending this.
 */
module.exports = class GameLobby extends BaseLobby {


    constructor(id, ownerID = Text, name = Text, settings = GameLobbySettings) {

        super(id);
        this.ownerID = ownerID;
        this.name = name;
        this.settings = settings;
        this.lobbyState.currentState = "Lobby";

    }

    onUpdate() {
        super.onUpdate();
    }

    //#region general lobby functionality
    canEnterLobby(connection = Connection) {

        let currentPlayerCount = this.connections.length;

        if (currentPlayerCount + 1 > this.settings.maxPlayers || this.lobbyState.currentState != 'Lobby') {
            return false;
        }
        return true;
    }

    onEnterLobby(connection = Connection) {
        super.onEnterLobby(connection);
        connection.socket.emit('joinSuccess');
        this.addPlayer(connection);

        //If server needs to spawn extra objects for new player, define that here (loot, enemies,...)
    }

    onLeaveLobby(connection = Connection) {

        super.onLeaveLobby(connection);
        this.removePlayer(connection);

        //If server needs to unspawn extra objects that were created for the leaving player, define that here (loot, enemies,...)

        //Refresh the UI for the remaining players (if they are in lobby selection)
        if (this.connections.length > 0) {
            this.ownerID = this.connections[0].player.id;
            this.connections[0].server.onGetPlayersInLobby(this.connections[0]);
        } else {
            connection.server.closeLobbyIfEmpty(this);
        }
    }

    addPlayer(connection = Connection) {

        //tell all players (clients) in the lobby that a new player spawned
        let returnData = { id: connection.player.id };
        connection.socket.emit('spawn', returnData);
        connection.socket.broadcast.to(this.id).emit('spawn', returnData);

        //tell the new player about every other player in the lobby
        this.connections.forEach(c => {
            if (c.player.id != connection.player.id) {
                connection.socket.emit('spawn', { id: c.player.id });
            }
        });
    }

    removePlayer(connection = Connection) {
        //broadcast to every player in the lobby that this player left the lobby
        connection.socket.broadcast.to(this.id).emit('disconnected', { id: connection.player.id });
    }

    tryToStartGame(connection = Connection) {

            for (let i = 0; i < this.connections.length; i++) {
                if (!this.connections[i].player.isReady) {
                    //Send error if needed
                    return;
                }
            }
            this.lobbyState.currentState = this.lobbyState.GAME;
            connection.socket.emit('startGame');
            connection.socket.broadcast.to(this.id).emit('startGame');
        }
        //#endregion
}