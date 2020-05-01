module.exports = class Vector2 {

    constructor(X = 0, Y = 0) {
        this.x = X;
        this.y = Y;
    }

    magnitude() {
        return Math.sqrt((this.x * this.x) + (this.y * this.y));
    }

    normalized() {
        let magnitude = this.magnitude();
        return new Vector2(this.x / magnitude, this.y / magnitude);
    }

    distance(other = Vector2) {
        let direction = new Vector2();
        direction.x = other.x - this.x;
        direction.y = other.y - this.y;
        return direction.magnitude();
    }

    consoleOutput() {
        return '(' + this.x + ',' + this.y + ')';
    }

}