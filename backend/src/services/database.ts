// src/services/database.ts - Versione TypeScript Safe e Corretta
import { DatabaseSchema, HeartbeatRecord } from '../types/types';
import fs from 'fs/promises';
import path from 'path';

export class DatabaseService {
  private readonly filePath: string;
  private data: DatabaseSchema;

  constructor() {
    this.filePath = path.resolve(__dirname, '../data/db.json');
    // Inizializza con struttura di default
    this.data = {
      heartbeats: [],
      lastPing: null,
      stats: {
        totalHeartbeats: 0,
        startTime: new Date().toISOString()
      }
    };
  }

  // Metodo per leggere i dati dal file
  private async read(): Promise<void> {
    try {
      const content = await fs.readFile(this.filePath, 'utf-8');
      this.data = JSON.parse(content) as DatabaseSchema;
    } catch (error: any) {
      // Se il file non esiste, lo creiamo
      if (error?.code === 'ENOENT') {
        await this.write();
      } else {
        console.error('❌ Errore lettura database:', error);
        // In caso di errore, usa dati di default
        this.data = {
          heartbeats: [],
          lastPing: null,
          stats: {
            totalHeartbeats: 0,
            startTime: new Date().toISOString()
          }
        };
      }
    }
  }

  // Metodo per scrivere i dati sul file
  private async write(): Promise<void> {
    try {
      // Crea la directory se non esiste
      await fs.mkdir(path.dirname(this.filePath), { recursive: true });
      await fs.writeFile(this.filePath, JSON.stringify(this.data, null, 2));
    } catch (error) {
      console.error('❌ Errore scrittura database:', error);
    }
  }

  async init(): Promise<void> {
    await this.read();
    console.log('📊 Database inizializzato con JSON nativo');
  }

  async saveHeartbeat(heartbeat: HeartbeatRecord): Promise<void> {
    await this.read();
    
    // Verifica che i dati esistano
    if (!this.data.heartbeats) {
      this.data.heartbeats = [];
    }
    
    if (!this.data.stats) {
      this.data.stats = {
        totalHeartbeats: 0,
        startTime: new Date().toISOString()
      };
    }
    
    this.data.heartbeats.push(heartbeat);
    this.data.lastPing = heartbeat.timestamp;
    this.data.stats.totalHeartbeats++;
    
    // Cleanup dei dati vecchi
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    this.data.heartbeats = this.data.heartbeats.filter(
      (h: HeartbeatRecord) => new Date(h.timestamp) > thirtyDaysAgo
    );
    
    await this.write();
  }

  async getLastHeartbeat(): Promise<HeartbeatRecord | null> {
    await this.read();
    
    // Controllo sicurezza per heartbeats
    if (!this.data.heartbeats || this.data.heartbeats.length === 0) {
      return null;
    }
    
    return this.data.heartbeats[this.data.heartbeats.length - 1] || null;
  }

  async getHeartbeatsLastMonth(): Promise<HeartbeatRecord[]> {
    await this.read();
    
    // Controllo sicurezza per heartbeats
    if (!this.data.heartbeats || this.data.heartbeats.length === 0) {
      return [];
    }
    
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    return this.data.heartbeats.filter(
      (h: HeartbeatRecord) => new Date(h.timestamp) > thirtyDaysAgo
    );
  }

  async getUptimeData(days: number = 7): Promise<{ label: string; uptime: string }[]> {
    await this.read();

    // Controllo sicurezza per heartbeats
    const heartbeats = this.data.heartbeats || [];
    const dailyCount: { [key: string]: number } = {};

    // Inizializza i giorni
    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateKey = date.toISOString().split('T')[0];
      
      if (dateKey) {
        dailyCount[dateKey] = 0;
      }
    }

    // Conta heartbeat per giorno
    heartbeats.forEach((heartbeat: HeartbeatRecord) => {
      if (heartbeat && heartbeat.timestamp && typeof heartbeat.timestamp === 'string') {
        const dateKey = heartbeat.timestamp.split('T')[0];
        
        if (dateKey && dateKey in dailyCount) {
          dailyCount[dateKey] = (dailyCount[dateKey] || 0) + 1;
        }
      }
    });

    // Genera risultato
    const expectedPerDay = 8640; // 1 heartbeat ogni 10 secondi
    const result: { label: string; uptime: string }[] = [];

    // Ordina le chiavi per data
    const sortedKeys = Object.keys(dailyCount).sort();
    
    for (const dateKey of sortedKeys) {
      const count = dailyCount[dateKey] || 0;
      const uptimePercentage = Math.min((count / expectedPerDay) * 100, 100);
      
      // Crea label leggibile
      const date = new Date(dateKey);
      const label = date.toLocaleDateString('it-IT', { weekday: 'short' }).toUpperCase();
      
      result.push({
        label: label,
        uptime: uptimePercentage.toFixed(1)
      });
    }

    return result;
  }

  async getStats(): Promise<{
    totalHeartbeats: number;
    lastPing: string | null;
    dbSize: number;
  }> {
    await this.read();
    
    // Controlli sicurezza con valori di default
    const totalHeartbeats = this.data.stats?.totalHeartbeats || 0;
    const lastPing = this.data.lastPing || null;
    const dbSize = this.data.heartbeats?.length || 0;
    
    return {
      totalHeartbeats,
      lastPing,
      dbSize
    };
  }
}
