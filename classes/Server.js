const Connection = require('./Connection');
const Player = require('./player');

//Lobbies
const BaseLobby = require('./lobbyTypes/BaseLobby');
const GameLobby = require('./lobbyTypes/GameLobby');
const GameLobbySettings = require('./lobbyTypes/GameLobbySettings');

module.exports = class Server {

    constructor() {
        this.connections = [];

        this.lobbies = [];

        this.lobbies[0] = new BaseLobby(0);
        this.lobbies[1] = new GameLobby(1, 'derp', new GameLobbySettings('test', 2));
        this.lobbies[2] = new GameLobby(2, 'derp2', new GameLobbySettings('testos', 3));
    }

    //server update interval
    onUpdate() {

        //update all existing lobbies
        this.lobbies.forEach(lobby => {
            lobby.onUpdate();
        });
    }

    //Handle a new connection to the server
    onConnected(socket) {
        //Create new connection object (+ new player object in it) and store reference to the socket and this server instance in it.
        var connection = new Connection();
        connection.socket = socket;
        connection.player = new Player();
        connection.server = this;

        let player = connection.player;
        console.log('[' + new Date(Date.now()) + '] A new player (' + player.id + ') has connected!');
        this.connections[player.id] = connection; //map the created connection to the id generated for the player (id generation happens in player class)

        socket.join(player.lobby); //
        connection.lobby = this.lobbies[player.lobby];
        connection.lobby.onEnterLobby(connection);

        return connection;
    }

    onDisconnected(connection = Connection) {

        let player = connection.player;
        console.log('[' + new Date(Date.now()) + '] Player ' + player.getPlayerInformation() + ' has disconnected!');
        delete this.connections[player.id];
        //Notify other players in the lobby disconnected player was about the disconnect
        connection.socket.broadcast.to(player.lobby).emit('disconnected', { id: player.id });
        //Cleanup the lobby
        let leftLobby = this.lobbies[player.lobby];
        leftLobby.onLeaveLobby(connection);

        //delete lobby if noone is connected to it anymore
        /*if (leftLobby.connections.length < 1 && leftLobby instanceof GameLobby) {
            let index = this.lobbies.indexOf(leftLobby);
            this.lobbies.splice(index, 1);
        }*/
    }

    onAttemptToJoinLobby(connection = Connection) {

        let lobbyFound = false;

        let gameLobbies = this.lobbies.filter(lobby => {
            return lobby instanceof GameLobby;
        });
        console.log('[' + new Date(Date.now()) + '] Found ' + gameLobbies.length + ' lobbies on the server.');

        gameLobbies.forEach(lobby => {
            if (!lobbyFound) {
                let canJoin = lobby.canEnterLobby(connection);
                if (canJoin) {
                    lobbyFound = true;
                    this.onSwitchLobby(connection, lobby.id);
                }
            }
        });

        if (!lobbyFound) {
            console.log('[' + new Date(Date.now()) + '] Creating an new lobby!');
            let gameLobby = new GameLobby(gameLobbies.length + 1, new GameLobbySettings('FFA', 2));
            this.lobbies.push(gameLobby);
            this.onSwitchLobby(connection, gameLobby.id);
        }
    }

    onGetExistingLobbies(connection = Connection) {
        let gameLobbies = this.lobbies.filter(lobby => {
            return lobby instanceof GameLobby;
        });
        let lobbyData = [];
        gameLobbies.forEach(lobby => {

            lobbyData.push({
                id: lobby.id,
                name: lobby.name,
                connectedPlayers: lobby.connections.length,
                maxPlayers: lobby.settings.maxPlayers
            });
        });
        connection.socket.emit('existingLobbies', { lobbyData });
    }

    onAttemptToCreateLobby(connection = Connection) {

    }

    onSwitchLobby(connection = Connection, lobbyID) {

        connection.socket.join(lobbyID); //join new lobby's room/channel
        connection.lobby = this.lobbies[lobbyID]; //assign reference to new lobby

        this.lobbies[connection.player.lobby].onLeaveLobby(connection); //leave current lobby (using reference to current lobby stored in player object)
        this.lobbies[lobbyID].onEnterLobby(connection); //join new lobby completely
    }
}