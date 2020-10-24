const shortID = require('shortid');

module.exports = class Player {

    constructor() {
        this.username = 'Default_Player';
        this.id = shortID.generate();
        this.isReady = false;
        this.lobby = 0;
        this.isControlling = false;
        this.inDialogue = false;
        this.inTask = false;

    }

    getPlayerInformation() {
        return '(' + this.username + ':' + this.id + ')';
    }

}