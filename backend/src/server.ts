import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { DatabaseService } from './services/database';
import { createApiRoutes } from './controllers/api';
import { setupSocket } from './services/socket';
import { MqttService } from './services/mqtt';
import { TelegramService } from './services/telegram';
import { MonitoringService } from './services/monitoring'; 

const app = express();

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: process.env.CORS_ORIGIN || "*" }
});

const db = new DatabaseService();
const telegram = new TelegramService();
const monitoring = new MonitoringService(db, telegram); 
const mqttService = new MqttService(db);
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

app.get('/monitoring/status', async (req, res) => {
  res.json(monitoring.getStatus());
});

// Socket.io setup
setupSocket(io);

// Start server
const PORT = process.env.PORT || 3000;

httpServer.listen(PORT, async () => {
  console.log(`🚀 Server avviato su porta ${PORT}`);
  
  try {
    db.init();
    await mqttService.connect();
    monitoring.startMonitoring(); 
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
