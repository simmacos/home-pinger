import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

import { createApiRoutes } from './controllers/api';
import { setupSocket } from './services/socket';
import { MqttService } from './services/mqtt';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: process.env.CORS_ORIGIN || "*" }
});

// Setup Services
const mqttService = new MqttService();
mqttService.setSocketIO(io);

// Middleware
app.use(cors());
app.use(express.json());


// API Routes con MQTT service
app.use('/api', createApiRoutes(mqttService));

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Home Dashboard Backend',
    status: 'running',
    mqtt: mqttService.getStatus(),
    timestamp: new Date().toISOString()
  });
});

// Socket.io setup
setupSocket(io);

// Start server
const PORT = process.env.PORT || 3000;

httpServer.listen(PORT, async () => {
  console.log(`🚀 Server avviato su porta ${PORT}`);
  
  try {
    await mqttService.connect();
    console.log('✅ Tutti i servizi attivi');
  } catch (error) {
    console.error('❌ Errore connessione MQTT:', error);
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  mqttService.disconnect();
  httpServer.close();
});
