const GameLobby = require('./GameLobby')
const GameletLobbySettings = require('./GameletLobbySettings');
const Connection = require('../Connection');
const ControlledCharacter = require('../ControlledCharacter');


module.exports = class GameletLobby extends GameLobby {

    characterInstance = ControlledCharacter;

    constructor(id, ownerID = Text, name = Text, settings = GameletLobbySettings) {

        super(id, ownerID, name, settings);
        this.characterInstance = new ControlledCharacter();

        this.lobbyState.currentState = this.lobbyState.LOBBY;
    }

    onUpdate() {
            super.onUpdate();
        }
        //#region Dialogue functionality
    enterDialogue(connection = Connection, dialogueID) {
        this.connections.forEach(c => {
            c.player.inDialogue = true;
        });
        this.lobbyState.currentState = this.lobbyState.DIALOGUE;
        connection.socket.emit('confirmedDialogueInit', { id: dialogueID });
        connection.socket.broadcast.to(this.id).emit('confirmedDialogueInit', { id: dialogueID });
    }


    leaveDialogue(connection = Connection) {
        connection.player.inDialogue = false;
        //check if other players are still reading
        for (let i = 0; i < this.connections.length; i++) {
            //Tell the client to wait if anyone still reads
            if (this.connections[i].player.inDialogue) {
                connection.socket.emit('dialogueInProgress');
                return;
            }
        }
        //Tell all clients to leave dialogue mode and continue game if not
        connection.socket.emit('confirmedDialogueEnd');
        connection.socket.broadcast.to(this.id).emit('confirmedDialogueEnd');
        this.lobbyState.currentState = this.lobbyState.GAME;
    }

    enterTask(connection = Connection) {
        if (this.lobbyState.currentState != this.lobbyState.TASK) {
            this.connections.forEach(c => {
                c.player.inTask = true;
                this.lobbyState.currentState = this.lobbyState.TASK;
            });
            connection.socket.broadcast.to(this.id).emit('confirmedTaskInit');
            connection.socket.emit('confirmedTaskInit');
        }
    }
    leaveTask(connection = Connection, bIsMajorTask) {
            connection.player.inTask = false;
            //check if other players are still in task panel
            for (let i = 0; i < this.connections.length; i++) {
                //Tell the client to wait if anyone still is in task panel
                if (this.connections[i].player.inTask) {
                    connection.socket.emit('taskInProgress');
                    return;
                }
            }
            //Tell all clients to leave dialogue mode and continue game if not
            connection.socket.emit('confirmedTaskEnd');
            connection.socket.broadcast.to(this.id).emit('confirmedTaskEnd');
            this.lobbyState.currentState = this.lobbyState.GAME;
            if (bIsMajorTask)
                this.assignCharacterControl();
        }
        //#endregion
        //#region PlayerControl functionality
    assignCharacterControl() {
        //Check if everyone already was in control.
        if (this.characterInstance.previousControllers.length >= this.connections.length) {
            //reset the tracker and call this function again
            this.characterInstance.previousControllers = [];
            this.assignCharacterControl();
            return;
        }
        //get all players who weren't in control yet
        let potentialControllers = [];
        for (let i = 0; i < this.connections.length; i++) {
            if (this.characterInstance.wasInControl(this.connections[i].player.id)) {
                continue;
            }
            potentialControllers.push(this.connections[i]);
        }
        //Choose a random player from these and assign control to this player
        let rng = Math.floor(Math.random() * potentialControllers.length);
        let controllingPlayer = this.connections[rng];
        controllingPlayer.player.isControlling = true;
        this.characterInstance.previousControllers.push(controllingPlayer.player.id);
        this.announceCurrentController(controllingPlayer);
    }

    announceCurrentController(connection = Connection) {
        let playerData = {
            id: connection.player.id,
            name: connection.player.username
        }
        connection.socket.emit('controllingPlayer', playerData);
        connection.socket.broadcast.to(this.id).emit('controllingPlayer', playerData)
    }
}