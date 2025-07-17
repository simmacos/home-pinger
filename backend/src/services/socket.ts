import { Server, Socket } from 'socket.io';

export function setupSocket(io: Server) {
  
  io.on('connection', (socket: Socket) => {
    console.log('🔌 Cliente connesso:', socket.id);
    
    // Benvenuto essenziale
    socket.emit('welcome', {
      message: 'Dashboard connessa',
      timestamp: new Date().toISOString()
    });
    
    // Test connessione frontend-backend
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