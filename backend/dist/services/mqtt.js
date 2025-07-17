"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MqttService = void 0;
const mqtt_1 = __importDefault(require("mqtt"));
const dotenv_1 = require("dotenv");
const path_1 = __importDefault(require("path"));
(0, dotenv_1.config)({ path: path_1.default.resolve(__dirname, '../../.env') });
class MqttService {
    constructor(db) {
        this.client = null;
        this.io = null;
        this.isConnected = false;
        this.lastHeartbeat = null;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.config = {
            host: process.env.MQTT_HOST || 'localhost',
            port: parseInt(process.env.MQTT_PORT || '1883'),
            topic: process.env.MQTT_TOPIC || 'casa/power/heartbeat',
            clientId: `home-dashboard-${Date.now()}`,
            reconnectPeriod: 1000,
            connectTimeout: 30000
        };
        this.db = db;
        console.log('📡 MQTT Service inizializzato');
        console.log(`📍 Configurazione: ${this.config.host}:${this.config.port}`);
        console.log(`📬 Topic: ${this.config.topic}`);
    }
    setSocketIO(io) {
        this.io = io;
        console.log('⚡ Socket.io collegato al MQTT service');
    }
    async connect() {
        return new Promise((resolve, reject) => {
            const mqttUrl = `mqtt://${this.config.host}:${this.config.port}`;
            console.log(`🔌 Tentativo connessione MQTT: ${mqttUrl}`);
            this.client = mqtt_1.default.connect(mqttUrl, {
                clientId: this.config.clientId,
                clean: true,
                reconnectPeriod: this.config.reconnectPeriod,
                connectTimeout: this.config.connectTimeout,
                will: {
                    topic: `${this.config.topic}/status`,
                    payload: 'Backend disconnesso',
                    qos: 1,
                    retain: false
                }
            });
            this.client.on('connect', () => {
                console.log('✅ Connesso a MQTT broker');
                console.log(`🆔 Client ID: ${this.config.clientId}`);
                this.isConnected = true;
                this.reconnectAttempts = 0;
                this.client?.subscribe(this.config.topic, { qos: 1 }, (err) => {
                    if (err) {
                        console.error('❌ Errore subscribe:', err);
                        reject(err);
                    }
                    else {
                        console.log(`📬 Sottoscritto a: ${this.config.topic}`);
                        resolve();
                    }
                });
            });
            this.client.on('message', (topic, message, packet) => {
                this.handleMessage(topic, message, packet);
            });
            this.client.on('error', (err) => {
                console.error('🔥 Errore MQTT:', err.message);
                this.isConnected = false;
                if (this.reconnectAttempts < this.maxReconnectAttempts) {
                    this.reconnectAttempts++;
                    console.log(`🔄 Tentativo riconnessione ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
                }
                else {
                    console.error('❌ Massimo numero di tentativi raggiunto');
                    reject(err);
                }
            });
            this.client.on('disconnect', () => {
                console.warn('⚠️ Disconnesso da MQTT broker');
                this.isConnected = false;
                this.io?.emit('mqtt_disconnected', {
                    timestamp: new Date().toISOString()
                });
            });
            this.client.on('reconnect', () => {
                console.log('🔄 Riconnessione MQTT in corso...');
                this.reconnectAttempts++;
            });
            this.client.on('close', () => {
                console.log('🔌 Connessione MQTT chiusa');
                this.isConnected = false;
            });
            this.client.on('offline', () => {
                console.warn('📴 MQTT client offline');
                this.isConnected = false;
            });
        });
    }
    handleMessage(topic, message, packet) {
        if (topic !== this.config.topic) {
            console.log(`📨 Messaggio da topic sconosciuto: ${topic}`);
            return;
        }
        try {
            const rawData = message.toString();
            console.log(`📬 Messaggio ricevuto: ${rawData}`);
            const heartbeatData = JSON.parse(rawData);
            if (this.isValidHeartbeat(heartbeatData)) {
                this.processHeartbeat(heartbeatData);
            }
            else {
                console.warn('⚠️ Heartbeat invalido ricevuto:', rawData);
            }
        }
        catch (error) {
            console.error('❌ Errore parsing messaggio MQTT:', error);
        }
    }
    isValidHeartbeat(data) {
        const isValid = (typeof data === 'object' &&
            data !== null &&
            typeof data.device === 'string' &&
            typeof data.counter === 'number' &&
            typeof data.uptime === 'number' &&
            typeof data.ip === 'string' &&
            typeof data.rssi === 'number' &&
            typeof data.timestamp === 'number');
        if (!isValid) {
            console.warn('⚠️ Validazione heartbeat fallita:', {
                device: typeof data?.device,
                counter: typeof data?.counter,
                uptime: typeof data?.uptime,
                ip: typeof data?.ip,
                rssi: typeof data?.rssi,
                timestamp: typeof data?.timestamp
            });
        }
        return isValid;
    }
    async processHeartbeat(data) {
        const now = new Date();
        this.lastHeartbeat = now;
        const heartbeatRecord = {
            id: `${now.getTime()}-${data.counter}`,
            timestamp: now.toISOString(),
            data: data,
            status: 'online'
        };
        console.log(`💓 Heartbeat processato: ${data.device} #${data.counter}`);
        console.log(`📡 ESP32 IP: ${data.ip}, RSSI: ${data.rssi}dBm`);
        console.log(`⏱️ Uptime ESP32: ${Math.floor(data.uptime / 1000)}s`);
        try {
            await this.db.saveHeartbeat(heartbeatRecord);
            console.log(`💾 Heartbeat salvato nel database`);
        }
        catch (error) {
            console.error('❌ Errore salvataggio database:', error);
        }
        if (this.io) {
            this.io.emit('heartbeat_received', {
                id: heartbeatRecord.id,
                counter: data.counter,
                timestamp: heartbeatRecord.timestamp,
                ip: data.ip,
                rssi: data.rssi,
                uptime: data.uptime,
                device: data.device,
                real: true
            });
        }
    }
    getStatus() {
        return {
            connected: this.isConnected,
            host: this.config.host,
            port: this.config.port,
            topic: this.config.topic,
            clientId: this.config.clientId,
            lastHeartbeat: this.lastHeartbeat?.toISOString() || null,
            reconnectAttempts: this.reconnectAttempts
        };
    }
    getStats() {
        return {
            connected: this.isConnected,
            lastHeartbeat: this.lastHeartbeat,
            timeSinceLastHeartbeat: this.lastHeartbeat ?
                Date.now() - this.lastHeartbeat.getTime() : null,
            reconnectAttempts: this.reconnectAttempts
        };
    }
    disconnect() {
        if (this.client) {
            console.log('🔌 Disconnessione MQTT...');
            this.client.end(true);
            this.client = null;
            this.isConnected = false;
            this.lastHeartbeat = null;
            console.log('✅ MQTT disconnesso');
        }
    }
}
exports.MqttService = MqttService;
//# sourceMappingURL=mqtt.js.map