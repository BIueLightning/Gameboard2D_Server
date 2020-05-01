const ServerObject = require('./ServerObjects.js');
const Vector2 = require('./Vector2.js');

module.exports = class Bullet extends ServerObject {

    constructor() {
        super();
        this.direction = new Vector2();
        this.speed = 2;
        this.isDestroyed = false;
        this.owner = '';
    }

    onUpdate() {
        this.position.x += this.direction.x * this.speed;
        this.position.y += this.direction.y * this.speed;
        return this.isDestroyed;
    }
}