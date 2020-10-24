const Connection = require('./Connection');
const Player = require('./player');

//Lobbies
const BaseLobby = require('./lobbyTypes/BaseLobby');
const GameletLobby = require('./lobbyTypes/GameletLobby');
const GameletLobbySettings = require('./lobbyTypes/GameletLobbySettings');
const LobbyState = require('./utilities/lobbyState');

const MAX_LOBBIES = 9;

module.exports = class Server {

    constructor() {
        this.connections = [];
        this.lobbyStates = new LobbyState();
        this.lobbies = new Map();

        this.lobbies.set(0, new BaseLobby(0));
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
        this.consoleOutput('A new player (' + player.id + ') has connected!');
        this.connections[player.id] = connection; //map the created connection to the id generated for the player (id generation happens in player class)

        connection.lobby = this.lobbies.get(player.lobby);
        connection.lobby.onEnterLobby(connection);

        return connection;
    }

    onTryToJoinSpecificLobby(connection = Connection, lobbyId) {
            if (lobbyId === 0) {
                this.onSwitchLobby(connection, lobbyId);
                return;
            }
            let gameLobbies = [];
            this.lobbies.forEach(lobby => {
                console.log(lobby instanceof GameletLobby);
                console.log(typeof lobby)
                if (lobby instanceof GameletLobby && lobby.lobbyState.currentState === this.lobbyStates.LOBBY) {
                    gameLobbies.push(lobby)
                }
            });

            for (let i = 0; i < gameLobbies.length; i++) {
                if (gameLobbies[i].id === lobbyId) {
                    if (gameLobbies[i].canEnterLobby(connection)) {
                        this.onSwitchLobby(connection, lobbyId);
                        return;
                    }
                }
            }
            connection.socket.emit('lobbyFull');
        }
        /*
        onAttemptToAnyLobby(connection = Connection) {

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
        }*/

    onGetExistingLobbies(connection = Connection) {
        let gameLobbies = [];
        this.lobbies.forEach(lobby => {
            if (lobby instanceof GameletLobby && lobby.lobbyState.currentState === this.lobbyStates.LOBBY) {
                gameLobbies.push(lobby)
            }
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
        this.consoleOutput('Sending lobby data to client (' + connection.player.id + ')');
        connection.socket.emit('existingLobbies', { lobbyData });
    }

    onTryToCreateLobby(connection = Connection, lobbyName) {
        if (this.lobbies.size < MAX_LOBBIES) {
            let gameLobby = new GameletLobby(this.lobbies.size, connection.player.id, lobbyName, new GameletLobbySettings('Gamelet', 4));

            this.consoleOutput('Creating new lobby: (' + lobbyName + ':' + gameLobby.id + ')!');
            this.lobbies.set(this.lobbies.size, gameLobby);
            this.onSwitchLobby(connection, gameLobby.id);
        } else {
            connection.socket.emit('maxLobbiesExceeded');
        }
    }

    onGetPlayersInLobby(connection = Connection) {

        let playerData = [];
        connection.lobby.connections.forEach(c => {
            playerData.push({
                id: c.player.id,
                username: c.player.username,
                isReady: c.player.isReady
            });

        });
        let returnData = {
            playerData: playerData,
            lobbyName: connection.lobby.name,
            lobbyOwnerID: connection.lobby.ownerID
        }
        connection.socket.emit('playersInLobby', { returnData });
        connection.socket.broadcast.to(connection.lobby.id).emit('playersInLobby', { returnData });
    }

    onPlayerReady(connection = Connection, isReady) {
        connection.player.isReady = isReady;
        this.onGetPlayersInLobby(connection);
    }

    onStartGame(connection = Connection) {
        connection.lobby.tryToStartGame(connection);
    }

    onSwitchLobby(connection = Connection, lobbyID) {

        connection.socket.join(lobbyID); //join new lobby's room/channel
        connection.lobby = this.lobbies[lobbyID]; //assign reference to new lobby

        this.lobbies.get(connection.player.lobby).onLeaveLobby(connection); //leave current lobby (using reference to current lobby stored in player object)
        this.lobbies.get(lobbyID).onEnterLobby(connection); //join new lobby completely
    }

    onDisconnected(connection = Connection) {
        let player = connection.player;
        let leftLobby = this.lobbies.get(player.lobby);

        this.consoleOutput('Player ' + player.getPlayerInformation() + ' has disconnected!');
        delete this.connections[player.id];
        //Notify other players in the lobby disconnected player was about the disconnect
        connection.socket.broadcast.to(player.lobby).emit('disconnected', { id: player.id });
        //Cleanup the lobby
        leftLobby.onLeaveLobby(connection);

        this.closeLobbyIfEmpty(leftLobby);
    }

    closeLobbyIfEmpty(lobby) {
        //delete lobby if noone is connected to it anymore
        if (lobby.connections.length < 1 && lobby instanceof GameletLobby) {
            this.consoleOutput('Lobby ' + lobby.name + ' is empty and will be closed!');
            this.lobbies.delete(lobby.id);
            lobby = undefined;
        }
    }

    consoleOutput(text = Text) {
        console.log('[' + new Date(Date.now()) + '] ' + text);
    }
}