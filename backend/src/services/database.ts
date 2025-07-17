// src/services/database.ts - Versione LowDB v2 Completa
import { DatabaseSchema, HeartbeatRecord } from '../types/types';
import path from 'path';

const { Low, JSONFile } = require('lowdb');

export class DatabaseService {
  private db: any; // Usa 'any' per v2 invece di Low<DatabaseSchema>

  constructor() {
    const filePath = path.resolve(__dirname, '../data/db.json');
    const adapter = new JSONFile(filePath);
    
    // Solo 1 parametro per LowDB v2
    this.db = new Low(adapter);
  }

  async init(): Promise<void> {
    await this.db.read();
    
    // Inizializzazione con ||= operator (v2 syntax)
    this.db.data ||= {
      heartbeats: [],
      lastPing: null,
      stats: {
        totalHeartbeats: 0,
        startTime: new Date().toISOString()
      }
    };
    
    await this.db.write();
    console.log('📊 Database inizializzato');
  }

  async saveHeartbeat(heartbeat: HeartbeatRecord): Promise<void> {
    await this.db.read();
    
    // Controllo e inizializzazione se necessario
    if (!this.db.data) {
      await this.init();
    }
    
    this.db.data.heartbeats.push(heartbeat);
    this.db.data.lastPing = heartbeat.timestamp;
    this.db.data.stats.totalHeartbeats++;
    
    // Cleanup vecchi dati
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    this.db.data.heartbeats = this.db.data.heartbeats.filter(
      (h: HeartbeatRecord) => new Date(h.timestamp) > thirtyDaysAgo
    );
    
    await this.db.write();
  }

  async getLastHeartbeat(): Promise<HeartbeatRecord | null> {
    await this.db.read();
    
    if (!this.db.data || !this.db.data.heartbeats) return null;
    
    const heartbeats = this.db.data.heartbeats;
    const lastHeartbeat = heartbeats[heartbeats.length - 1];
    
    return lastHeartbeat || null;
  }

  async getHeartbeatsLastMonth(): Promise<HeartbeatRecord[]> {
    await this.db.read();
    
    if (!this.db.data || !this.db.data.heartbeats) return [];
    
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    return this.db.data.heartbeats.filter(
      (h: HeartbeatRecord) => new Date(h.timestamp) > thirtyDaysAgo
    );
  }

  async getUptimeData(days = 7): Promise<{ label: string; uptime: string }[]> {
    await this.db.read();

    // Controllo sicurezza database
    if (!this.db.data || !this.db.data.heartbeats) {
      return [];
    }

    const heartbeats = this.db.data.heartbeats;
    const dailyCount: { [key: string]: number } = {};

    // Inizializza giorni
    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateKey = date.toISOString().split('T')[0];
      
      if (dateKey) {
        dailyCount[dateKey] = 0;
      }
    }

    // Conta heartbeat con controlli espliciti
    heartbeats.forEach((heartbeat: HeartbeatRecord) => {
      if (heartbeat && heartbeat.timestamp && typeof heartbeat.timestamp === 'string') {
        const parts = heartbeat.timestamp.split('T');
        
        if (parts.length > 0 && parts[0]) {
          const dateKey = parts[0];
          
          if (dateKey in dailyCount) {
            dailyCount[dateKey] = (dailyCount[dateKey] || 0) + 1;
          }
        }
      }
    });

    // Genera risultato
    const expectedPerDay = 8640;
    const result: { label: string; uptime: string }[] = [];

    Object.keys(dailyCount).forEach(dateKey => {
      const count = dailyCount[dateKey] || 0;
      const uptimePercentage = Math.min((count / expectedPerDay) * 100, 100);
      result.push({
        label: dateKey,
        uptime: uptimePercentage.toFixed(1)
      });
    });

    result.sort((a, b) => a.label.localeCompare(b.label));
    return result;
  }

  async getStats() {
    await this.db.read();
    
    if (!this.db.data) {
      return {
        totalHeartbeats: 0,
        lastPing: null,
        dbSize: 0
      };
    }
    
    return {
      totalHeartbeats: this.db.data.stats.totalHeartbeats,
      lastPing: this.db.data.lastPing,
      dbSize: this.db.data.heartbeats.length
    };
  }
}
