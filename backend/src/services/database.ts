// src/services/database.ts
import { Low } from 'lowdb'
import { JSONFile } from 'lowdb/node'
import { DatabaseSchema, HeartbeatRecord } from '../types/types';
import path from 'path';

export class DatabaseService {
  private db: Low<DatabaseSchema>;

  constructor() {
    const filePath = path.resolve(__dirname, '../data/db.json');
    const adapter = new JSONFile<DatabaseSchema>(filePath);
    
    const defaultData: DatabaseSchema = {
      heartbeats: [],
      lastPing: null,
      stats: {
        totalHeartbeats: 0,
        startTime: new Date().toISOString()
      }
    };
    
    this.db = new Low(adapter, defaultData);
  }

  async init(): Promise<void> {
    await this.db.read();
    await this.db.write();
    console.log('📊 Database inizializzato');
  }

  async saveHeartbeat(heartbeat: HeartbeatRecord): Promise<void> {
    await this.db.read();
    
    // Assicurati che this.db.data esista
    if (!this.db.data) {
      throw new Error('Database non inizializzato');
    }
    
    this.db.data.heartbeats.push(heartbeat);
    this.db.data.lastPing = heartbeat.timestamp;
    this.db.data.stats.totalHeartbeats++;
    
    // Cleanup vecchi dati
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    this.db.data.heartbeats = this.db.data.heartbeats.filter(
      h => new Date(h.timestamp) > thirtyDaysAgo
    );
    
    await this.db.write();
  }

  async getLastHeartbeat(): Promise<HeartbeatRecord | null> {
    await this.db.read();
    
    if (!this.db.data) return null;
    
    const heartbeats = this.db.data.heartbeats;
    const lastHeartbeat = heartbeats[heartbeats.length - 1];
    
    return lastHeartbeat || null;
  }

  async getHeartbeatsLastMonth(): Promise<HeartbeatRecord[]> {
    await this.db.read();
    
    if (!this.db.data) return [];
    
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    return this.db.data.heartbeats.filter(
      h => new Date(h.timestamp) > thirtyDaysAgo
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

  // Inizializza giorni con date valide
  for (let i = 0; i < days; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateKey = date.toISOString().split('T')[0];
    
    // dateKey è sempre una stringa valida qui
    if (dateKey) {
      dailyCount[dateKey] = 0;
    }
  }

  // Conta heartbeat con controlli espliciti
  heartbeats.forEach(heartbeat => {
    // Controllo che heartbeat e timestamp esistano
    if (heartbeat && heartbeat.timestamp && typeof heartbeat.timestamp === 'string') {
      const parts = heartbeat.timestamp.split('T');
      
      // Controllo che split abbia prodotto almeno un elemento
      if (parts.length > 0 && parts[0]) {
        const dateKey = parts[0];
        
        // Controllo che dateKey esista in dailyCount
        if (dateKey in dailyCount) {
          dailyCount[dateKey] = (dailyCount[dateKey] || 0) + 1;
        }
      }
    }
  });

  // Genera risultato con controlli sicuri
  const expectedPerDay = 8640;
  const result: { label: string; uptime: string }[] = [];

  // Itera solo su chiavi che sappiamo esistere
  Object.keys(dailyCount).forEach(dateKey => {
    const count = dailyCount[dateKey];
    
    // count è sempre un number qui perché l'abbiamo inizializzato
    if (typeof count === 'number') {
      const uptimePercentage = Math.min((count / expectedPerDay) * 100, 100);
      result.push({
        label: dateKey,
        uptime: uptimePercentage.toFixed(1)
      });
    }
  });

  // Ordina per data
  result.sort((a, b) => a.label.localeCompare(b.label));

  return result;
}


  async getStats() {
    await this.db.read();
    
    // Controllo sicurezza per this.db.data
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
