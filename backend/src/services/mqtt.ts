// src/services/mqtt.ts
import mqtt, { MqttClient } from 'mqtt';
import { Server } from 'socket.io';
import { HeartbeatData, HeartbeatRecord} from '../types/types';
import { config } from 'dotenv';
import path from 'path';

config({ path: path.resolve(__dirname, '../../.env') });


export class MqttService {
  private client: MqttClient | null = null;
  private io: Server | null = null;
  private isConnected = false;
  private lastHeartbeat: Date | null = null;
  private reconnectAttempts = 0;
  private readonly maxReconnectAttempts = 5;
  
  private readonly config = {
    host: process.env.MQTT_HOST || 'localhost',
    port: parseInt(process.env.MQTT_PORT || '1883'),
    topic: process.env.MQTT_TOPIC || 'casa/power/heartbeat',
    clientId: `home-dashboard-${Date.now()}`,
    reconnectPeriod: 1000,
    connectTimeout: 30000
  };

  constructor() {
    console.log('📡 MQTT Service inizializzato');
    console.log(`📍 Configurazione: ${this.config.host}:${this.config.port}`);
    console.log(`📬 Topic: ${this.config.topic}`);
  }

  // Imposta Socket.io per eventi real-time
  setSocketIO(io: Server): void {
    this.io = io;
    console.log('⚡ Socket.io collegato al MQTT service');
  }

  // Connessione al broker MQTT
  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      const mqttUrl = `mqtt://${this.config.host}:${this.config.port}`;
      
      console.log(`🔌 Tentativo connessione MQTT: ${mqttUrl}`);
      
      this.client = mqtt.connect(mqttUrl, {
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

      // Event: Connessione riuscita
      this.client.on('connect', () => {
        console.log('✅ Connesso a MQTT broker');
        console.log(`🆔 Client ID: ${this.config.clientId}`);
        
        this.isConnected = true;
        this.reconnectAttempts = 0;
        
        // Sottoscrivi al topic heartbeat
        this.client?.subscribe(this.config.topic, { qos: 1 }, (err) => {
          if (err) {
            console.error('❌ Errore subscribe:', err);
            reject(err);
          } else {
            console.log(`📬 Sottoscritto a: ${this.config.topic}`);
            resolve();
          }
        });
      });

      // Event: Messaggio ricevuto
      this.client.on('message', (topic, message, packet) => {
        this.handleMessage(topic, message, packet);
      });

      // Event: Errore
      this.client.on('error', (err) => {
        console.error('🔥 Errore MQTT:', err.message);
        this.isConnected = false;
        
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts++;
          console.log(`🔄 Tentativo riconnessione ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
        } else {
          console.error('❌ Massimo numero di tentativi raggiunto');
          reject(err);
        }
      });

      // Event: Disconnessione
      this.client.on('disconnect', () => {
        console.warn('⚠️ Disconnesso da MQTT broker');
        this.isConnected = false;
        
        // Notifica via Socket.io
        this.io?.emit('mqtt_disconnected', { 
          timestamp: new Date().toISOString() 
        });
      });

      // Event: Riconnessione
      this.client.on('reconnect', () => {
        console.log('🔄 Riconnessione MQTT in corso...');
        this.reconnectAttempts++;
      });

      // Event: Connessione chiusa
      this.client.on('close', () => {
        console.log('🔌 Connessione MQTT chiusa');
        this.isConnected = false;
      });

      // Event: Messaggio offline
      this.client.on('offline', () => {
        console.warn('📴 MQTT client offline');
        this.isConnected = false;
      });
    });
  }

  // Gestisce i messaggi MQTT ricevuti
  private handleMessage(topic: string, message: Buffer, packet: any): void {
    if (topic !== this.config.topic) {
      console.log(`📨 Messaggio da topic sconosciuto: ${topic}`);
      return;
    }

    try {
      const rawData = message.toString();
      console.log(`📬 Messaggio ricevuto: ${rawData}`);
      
      const heartbeatData: HeartbeatData = JSON.parse(rawData);
      
      // Valida i dati
      if (this.isValidHeartbeat(heartbeatData)) {
        this.processHeartbeat(heartbeatData);
      } else {
        console.warn('⚠️ Heartbeat invalido ricevuto:', rawData);
      }
      
    } catch (error) {
      console.error('❌ Errore parsing messaggio MQTT:', error);
    }
  }

  // Valida i dati heartbeat
  private isValidHeartbeat(data: any): data is HeartbeatData {
    const isValid = (
      typeof data === 'object' &&
      data !== null &&
      typeof data.device === 'string' &&
      typeof data.counter === 'number' &&
      typeof data.uptime === 'number' &&
      typeof data.ip === 'string' &&
      typeof data.rssi === 'number' &&
      typeof data.timestamp === 'number'
    );

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

  // Processa heartbeat valido
  private processHeartbeat(data: HeartbeatData): void {
    const now = new Date();
    this.lastHeartbeat = now;
    
    const heartbeatRecord: HeartbeatRecord = {
      id: `${now.getTime()}-${data.counter}`,
      timestamp: now.toISOString(),
      data: data,
      status: 'online'
    };

    console.log(`💓 Heartbeat processato: ${data.device} #${data.counter}`);
    console.log(`📡 ESP32 IP: ${data.ip}, RSSI: ${data.rssi}dBm`);
    console.log(`⏱️ Uptime ESP32: ${Math.floor(data.uptime/1000)}s`);

    // Invia via Socket.io a tutti i client connessi
    if (this.io) {
      this.io.emit('heartbeat_received', {
        id: heartbeatRecord.id,
        counter: data.counter,
        timestamp: heartbeatRecord.timestamp,
        ip: data.ip,
        rssi: data.rssi,
        uptime: data.uptime,
        device: data.device,
        real: true // Flag per distinguere da simulazione
      });
    }

    // TODO: Salvare nel database
    // await this.saveToDatabase(heartbeatRecord);
  }

  // Stato del servizio
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

  // Statistiche di connessione
  getStats() {
    return {
      connected: this.isConnected,
      lastHeartbeat: this.lastHeartbeat,
      timeSinceLastHeartbeat: this.lastHeartbeat ? 
        Date.now() - this.lastHeartbeat.getTime() : null,
      reconnectAttempts: this.reconnectAttempts
    };
  }

  // Disconnessione pulita
  disconnect(): void {
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
