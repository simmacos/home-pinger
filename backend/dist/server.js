"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const cors_1 = __importDefault(require("cors"));
const api_1 = require("./controllers/api");
const socket_1 = require("./services/socket");
const database_1 = require("./services/database");
const telegram_1 = require("./services/telegram");
const monitoring_1 = require("./services/monitoring");
const mqtt_1 = require("./services/mqtt");
const app = (0, express_1.default)();
const httpServer = (0, http_1.createServer)(app);
const io = new socket_io_1.Server(httpServer, {
    cors: { origin: process.env.CORS_ORIGIN || "*" }
});
const db = new database_1.DatabaseService();
const telegram = new telegram_1.TelegramService();
const monitoring = new monitoring_1.MonitoringService(db, telegram);
const mqttService = new mqtt_1.MqttService(db);
mqttService.setSocketIO(io);
app.use((0, cors_1.default)());
app.use(express_1.default.json());
db.init();
app.use('/api', (0, api_1.createApiRoutes)(mqttService, db));
app.get('/', async (req, res) => {
    res.json({
        message: 'Home Dashboard Backend',
        status: 'running',
        mqtt: mqttService.getStatus(),
        database: await db.getStats(),
        timestamp: new Date().toISOString()
    });
});
(0, socket_1.setupSocket)(io);
const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, async () => {
    console.log(`🚀 Server avviato su porta ${PORT}`);
    try {
        await mqttService.connect();
        monitoring.startMonitoring();
        console.log('✅ Tutti i servizi attivi');
    }
    catch (error) {
        console.error('❌ Errore avvio servizi:', error);
    }
});
process.on('SIGTERM', () => {
    mqttService.disconnect();
    httpServer.close();
});
//# sourceMappingURL=server.js.map