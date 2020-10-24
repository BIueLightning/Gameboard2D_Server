module.exports = class Connection {
    constructor() {
        this.socket;
        this.player;
        this.server;
        this.lobby;
    }

    //Handles all io Events and the routing to handle them in depth
    createEvents() {
        let socket = this.socket;
        let server = this.server;
        //#region connection & lobby events
        socket.on('playerData', (data) => {
            this.player.username = data.playerName;
            console.log('[' + new Date(Date.now()) + '] Player (' + this.player.id + ') changed the username to: ' + this.player.username + '!');
        });
        socket.on('getLobbies', () => {
            server.onGetExistingLobbies(this);
        });

        socket.on('getLobbyPlayers', () => {
            server.onGetPlayersInLobby(this);
        });

        socket.on('joinLobby', (data) => {
            server.onTryToJoinSpecificLobby(this, data.id);
        });

        socket.on('createLobby', (data) => {
            server.onTryToCreateLobby(this, data.id);
        })

        socket.on('lobbyStart', () => {
            server.onStartGame(this);
        });

        socket.on('playerReady', (data) => {
            server.onPlayerReady(this, data.isTrue);
        })

        socket.on('joinRandomGame', () => {
            server.onAttemptToAnyLobby(this);
        });

        socket.on('disconnect', () => {
            server.onDisconnected(this);
        });
        //#endregion
        //#region in game events
        socket.on('levelLoaded', () => {
            if (this.lobby.ownerID === this.player.id)
                this.lobby.assignCharacterControl();
        });

        socket.on('moveLeft', () => {
            if (!this.player.isControlling || !this.lobby.lobbyState.currentState === server.lobbyStates.GAME)
                return;

            this.socket.emit('confirmedLeft');
            this.socket.broadcast.to(this.lobby.id).emit('confirmedLeft');
        });

        socket.on('moveRight', () => {
            if (!this.player.isControlling || !this.lobby.lobbyState.currentState === server.lobbyStates.GAME)
                return;

            this.socket.emit('confirmedRight');
            this.socket.broadcast.to(this.lobby.id).emit('confirmedRight');
        });

        socket.on('initDialogue', (data) => {
            if (!this.player.isControlling || !this.lobby.lobbyState.currentState === server.lobbyStates.GAME)
                return;

            this.lobby.enterDialogue(this, data.id)
        });

        socket.on('finishedDialogue', () => {
            this.lobby.leaveDialogue(this);
        });

        socket.on('initTask', () => {
            if (!this.player.isControlling || !this.lobby.lobbyState.currentState === server.lobbyStates.GAME)
                return;

            this.lobby.enterTask(this);
        });

        socket.on('finishedTask', (data) => {
            this.lobby.leaveTask(this, data.isTrue);
        });
        ////#endregion
    }
}