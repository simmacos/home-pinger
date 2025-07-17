"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupSocket = setupSocket;
function setupSocket(io) {
    io.on('connection', (socket) => {
        console.log('🔌 Cliente connesso:', socket.id);
        socket.emit('welcome', {
            message: 'Dashboard connessa',
            timestamp: new Date().toISOString()
        });
        socket.on('ping', () => {
            socket.emit('pong', {
                timestamp: new Date().toISOString()
            });
        });
        socket.on('disconnect', (reason) => {
            console.log('❌ Cliente disconnesso:', socket.id, reason);
        });
    });
    console.log('⚡ Socket.io configurato');
}
//# sourceMappingURL=socket.js.map