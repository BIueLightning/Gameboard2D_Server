const BaseLobby = require('./BaseLobby');
const GameLobbySettings = require('./GameLobbySettings');
const Connection = require('../Connection');
let Bullet = require('../Bullet');

module.exports = class GameLobby extends BaseLobby {

    constructor(id, name = Text, settings = GameLobbySettings) {

        super(id);
        this.name = name;
        this.settings = settings;
        this.bullets = [];

    }

    onUpdate() {
        this.updateBullets();
        this.updatePlayerRespawns();
    }

    canEnterLobby(connection = Connection) {

        let currentPlayerCount = this.connections.length;

        if (currentPlayerCount + 1 > this.settings.maxPlayers) {
            return false;
        }
        return true;
    }

    onEnterLobby(connection = Connection) {
        super.onEnterLobby(connection);
        this.addPlayer(connection);

        //If server needs to spawn extra objects for new player, define that here (loot, enemies,...)
    }

    onLeaveLobby(connection = Connection) {

        super.onLeaveLobby(connection);
        this.removePlayer(connection);

        //If server needs to unspawn extra objects that were created for the leaving player, define that here (loot, enemies,...)
    }

    addPlayer(connection = Connection) {

        let returnData = {
                id: connection.player.id
            }
            //tell all players (clients) in the lobby that a new player spawned
        connection.socket.emit('spawn', returnData);
        connection.socket.broadcast.to(this.id).emit('spawn', returnData);

        //tell the new player about every other player in the lobby
        this.connections.forEach(c => {
            if (c.player.id != connection.player.id) {
                connection.socket.emit('spawn', { id: c.player.id });
            }
        });
    }

    removePlayer(connection = Connection) {
        //broadcast to every player in the lobby that this player left the lobby
        connection.socket.broadcast.to(this.id).emit('disconnected', { id: connection.player.id });
    }

    onFireBullet(connection = Connection, data) {
        let bullet = new Bullet();
        bullet.name = 'Bullet';
        bullet.owner = data.owner;
        bullet.position.x = data.position.x;
        bullet.position.y = data.position.y;
        bullet.direction.x = data.direction.x;
        bullet.direction.y = data.direction.y;

        this.bullets.push(bullet);

        let returnData = {
            name: bullet.name,
            owner: bullet.owner,
            id: bullet.id,
            position: {
                x: bullet.position.x,
                y: bullet.position.y
            },
            direction: {
                x: bullet.direction.x,
                y: bullet.direction.y
            },
            speed: bullet.speed
        }

        connection.socket.emit('serverSpawn', returnData);
        connection.socket.broadcast.to(this.id).emit('serverSpawn', returnData);
    }

    onCollisionDestroy(connection = Connection, data) {

        let returnBullets = this.bullets.filter(bullet => {
            return bullet.id == data.id;
        });


        //loop through each returned bullet (most likely only one)
        returnBullets.forEach(bullet => {
            let playerHit = false;

            //Check if someone other than the bullet owner was hit
            this.connections.forEach(c => {
                let player = c.player;
                if (bullet.owner == player.id) {
                    return;
                }

                let distance = bullet.position.distance(player.position);

                if (distance < 0.95) {
                    //Deal damage to hit player
                    let isDead = player.receiveDamage(50);
                    if (isDead) {
                        console.log('[' + new Date(Date.now()) + '] Player with id: ' + player.id + ' died.');

                        let returnData = {
                            id: player.id
                        }
                        c.socket.emit('playerDied', returnData);
                        c.socket.broadcast.to(this.id).emit('playerDied', returnData);
                    } else {
                        console.log('[' + new Date(Date.now()) + '] Player with id: ' + player.id + ' was hit and has ' + player.health + ' left.');
                    }
                    //Destroy bullet immediatly
                    this.despawnBullet(bullet);
                }

            });
            //Bullet didn't hit a player so flag it for removal in normal server loop
            bullet.isDestroyed = true;
        });
    }

    despawnBullet(bullet = Bullet) {

        let index = this.bullets.indexOf(bullet);

        if (index > -1) {
            this.bullets.splice(index, 1);
            let returnData = {
                id: bullet.id
            }
            this.connections.forEach(connection => {
                connection.socket.emit('serverUnspawn', returnData);
            });
        }
    }

    //#region onUpdate functions
    updateBullets() {

        this.bullets.forEach(bullet => {
            let isDestroyed = bullet.onUpdate(); //onUpdate() returns if bullet was destroyed in last update cycle

            if (isDestroyed) {
                //Despawn bullet if destroyed and handle next bullet
                this.despawnBullet(bullet);
                return;
            }
            //otherwise send a package with the updated position to each player (position calculation happened in onUpdate() call above)
            /*let returnData = {
                id: bullet.id,
                position: {
                    x: bullet.position.x,
                    y: bullet.position.y
                }
            }
            this.connections.forEach(connection => {
                connection.socket.emit('updatePosition', returnData);
            });*/
        });

    }

    updatePlayerRespawns() {

            this.connections.forEach(connection => {
                let player = connection.player;

                //jump to next player if player isn't dead
                if (!player.isDead) {
                    return;
                }
                //call the respawnCounter() of player which counts and returns if the player may respawn yet. Jump to next player if not
                let mayRespawn = player.respawnCounter();
                if (!mayRespawn) {
                    return;
                }
                let returnData = {
                    id: player.id,
                    position: {
                        x: player.position.x,
                        y: player.position.y
                    }
                }
                connection.socket.emit('playerRespawn', returnData);
                connection.socket.broadcast.to(this.id).emit('playerRespawn', returnData);

            });
        }
        //#endregion
}