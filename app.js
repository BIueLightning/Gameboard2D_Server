const io = require('socket.io')(process.env.PORT || 7777);
let Server = require('./classes/Server');

let server = new Server();

console.log('[' + new Date(Date.now()) + '] Starting services...');
setTimeout(() => {
    console.log('[' + new Date(Date.now()) + '] Setting up worker threads...');
    setTimeout(() => {
        console.log('[' + new Date(Date.now()) + '] Starting server...');
        setTimeout(() => {
            console.log('[' + new Date(Date.now()) + '] Server running and ready!');
        }, 4000)
    }, 1900)
}, 1800)


//Server update loop
setInterval(() => {
    server.onUpdate();
}, 50, 0);

io.on('connection', (socket) => {
    let connection = server.onConnected(socket);
    connection.createEvents();
    connection.socket.emit('register', { 'id': connection.player.id });
});
/*
function interval(func, wait, times) {

    let interv = function(w, t) {
        return function() {
            if (typeof t === "undefined" || t-- > 0) {
                setTimeout(interv, w);
                try {
                    func.call(null);
                } catch (e) {
                    t = 0;
                    throw e.toString();
                }
            }
        };
    }(wait, times);

    setTimeout(interv, wait);
}*/