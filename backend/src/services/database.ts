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
    
    // Fix errore 1: LowDB vuole 2 parametri (adapter + defaultData)
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
    
    const heartbeats = this.db.data.heartbeats;
    const lastHeartbeat = heartbeats[heartbeats.length - 1];
    
    return lastHeartbeat || null;
  }

  async getHeartbeatsLastMonth(): Promise<HeartbeatRecord[]> {
    await this.db.read();
    
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    return this.db.data.heartbeats.filter(
      h => new Date(h.timestamp) > thirtyDaysAgo
    );
  }

  async getStats() {
    await this.db.read();
    
    return {
      totalHeartbeats: this.db.data.stats.totalHeartbeats,
      lastPing: this.db.data.lastPing,
      dbSize: this.db.data.heartbeats.length
    };
  }
}
