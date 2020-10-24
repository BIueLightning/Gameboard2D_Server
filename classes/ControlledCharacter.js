const Vector2 = require("./Vector2");

module.exports = class ControlledCharacter {

    constructor() {
        this.position = new Vector2();
        this.previousControllers = [];
    }

    wasInControl(id) {
        console.log(this.previousControllers);
        for (let i = 0; i < this.previousControllers.length; i++) {
            if (id === this.previousControllers[i]) {
                return true;
            }
        }
        return false;
    }
}