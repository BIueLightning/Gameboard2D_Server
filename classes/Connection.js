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

        socket.on('getLobbies', () => {
            console.log('called get lobbies!');
            server.onGetExistingLobbies(this);
        });

        socket.on('joinLobby', (data) => {

        });

        socket.on('joinGame', () => {
            server.onAttemptToJoinLobby(this);
        });

        socket.on('fireBullet', (data) => {
            this.lobby.onFireBullet(this, data);
        });

        socket.on('collisionDestroy', (data) => {
            this.lobby.onCollisionDestroy(this, data);
        });

        socket.on('updatePosition', (data) => {
            this.player.position.x = data.position.x;
            this.player.position.y = data.position.y;

            socket.broadcast.to(this.lobby.id).emit('updatePosition', this.player);
        });

        socket.on('updateRotation', (data) => {
            this.player.tankRotation = data.tankRotation;
            this.player.barrelRotation = data.barrelRotation;

            socket.broadcast.to(this.lobby.id).emit('updateRotation', this.player);
        });

        socket.on('disconnect', () => {
            server.onDisconnected(this);
        });

    }
}