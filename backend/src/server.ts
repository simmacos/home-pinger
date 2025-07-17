// src/server.ts
import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

import { createApiRoutes } from './controllers/api';
import { setupSocket } from './services/socket';
import { DatabaseService } from './services/database';
import { TelegramService } from './services/telegram';
import { MonitoringService } from './services/monitoring';
import { MqttService } from './services/mqtt';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: process.env.CORS_ORIGIN || "*" }
});


// Setup Services
const db = new DatabaseService();
const telegram = new TelegramService();
const monitoring = new MonitoringService(db, telegram);
const mqttService = new MqttService(db);

// IMPORTANTE: Passa Socket.io al MQTT service per emettere eventi
mqttService.setSocketIO(io);

// Middleware
app.use(cors());
app.use(express.json());
db.init();

app.use('/api', createApiRoutes(mqttService, db));

// Root endpoint
app.get('/', async (req, res) => {
  res.json({
    message: 'Home Dashboard Backend',
    status: 'running',
    mqtt: mqttService.getStatus(),
    database: await db.getStats(),
    timestamp: new Date().toISOString()
  });
});

// Socket.io setup (minimo)
setupSocket(io);

// Start server
const PORT = process.env.PORT || 3000;

httpServer.listen(PORT, async () => {
  console.log(`🚀 Server avviato su porta ${PORT}`);
  
  try {
    await mqttService.connect();
    monitoring.startMonitoring();
    console.log('✅ Tutti i servizi attivi');
  } catch (error) {
    console.error('❌ Errore avvio servizi:', error);
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  mqttService.disconnect();
  httpServer.close();
});
