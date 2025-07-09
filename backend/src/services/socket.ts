// src/socket.ts - Tutta la logica Socket.io
import { Server, Socket } from 'socket.io';

export function setupSocket(io: Server) {
  
  io.on('connection', (socket: Socket) => {
    console.log('🔌 Cliente connesso:', socket.id);
    
    // Welcome message
    socket.emit('welcome', {
      message: 'Connesso al dashboard backend!',
      timestamp: new Date().toISOString(),
      socketId: socket.id
    });
    
    // Ping-pong per test connessione
    socket.on('ping', () => {
      socket.emit('pong', { 
        timestamp: new Date().toISOString(),
        serverTime: Date.now()
      });
    });
    
    // Test heartbeat simulation (rimuoveremo quando avremo MQTT)
    socket.on('test_heartbeat', (data) => {
      console.log('🧪 Test heartbeat ricevuto:', data);
      
      // Broadcast a tutti i client connessi
      io.emit('heartbeat_received', {
        counter: data.counter || 1,
        timestamp: new Date().toISOString(),
        ip: '192.168.1.100',
        rssi: -45,
        test: true
      });
    });
    
    // Gestione disconnessione
    socket.on('disconnect', (reason) => {
      console.log('❌ Cliente disconnesso:', socket.id, 'Motivo:', reason);
    });
    
    // Error handling
    socket.on('error', (error) => {
      console.error('🔥 Errore socket:', socket.id, error);
    });
  });
  
  console.log('⚡ Socket.io configurato');
  
  // Simulazione heartbeat ogni 10 secondi (per test)
  let testCounter = 0;
  setInterval(() => {
    testCounter++;
    io.emit('heartbeat_received', {
      counter: testCounter,
      timestamp: new Date().toISOString(),
      ip: '192.168.1.100',
      rssi: Math.floor(Math.random() * 30) - 70, // Random RSSI
      simulation: true
    });
    console.log(`📡 Heartbeat simulato #${testCounter}`);
  }, 10000);
}
