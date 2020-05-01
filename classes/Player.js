const shortID = require('shortid');
var Vector2 = require('./Vector2.js');

module.exports = class Player {

    constructor() {
        this.username = 'Default_Player';
        this.id = shortID.generate();
        this.health = new Number(100);
        this.lobby = new Number(0);
        this.position = new Vector2();
        this.tankRotation = new Number(0);
        this.barrelRotation = new Number(0);
        this.isDead = false;
        this.respawnTicker = new Number(0);
        this.respawnTime = new Number(0);
    }

    respawnCounter() {

        this.respawnTicker += 1;
        if (this.respawnTicker >= 10) {
            this.respawnTicker = 0;
            this.respawnTime += 1;

            if (this.respawnTime >= 3) {
                console.log("Respawning " + this.id);
                this.isDead = false;
                this.health = 100;
                this.position = new Vector2(0, 0);

                return true;
            }
        }
        return false;
    }

    getPlayerInformation() {
        return '(' + this.username + ':' + this.id + ')';
    }

    receiveDamage(value = number) {

        this.health = this.health - value;

        if (this.health <= 0) {
            this.isDead = true;
            this.respawnTicker = new Number(0);
            this.respawnTime = new Number(0);
        }

        return this.isDead;
    }
}