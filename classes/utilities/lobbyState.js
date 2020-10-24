module.exports = class LobbyState {
    constructor() {
        this.BASE = 'Base';
        this.LOBBY = 'Lobby';
        this.GAME = 'Game';
        this.DIALOGUE = 'Dialogue';
        this.TASK = 'TASK';
        this.END = 'END';

        this.currentState = "Lobby";
    }
}