// src/services/monitoring.ts
import { DatabaseService } from './database';
import { TelegramService } from './telegram';

export class MonitoringService {
  private db: DatabaseService;
  private telegram: TelegramService;
  private isCurrentlyOffline: boolean = false;
  private offlineStartTime: Date | null = null;
  
  constructor(db: DatabaseService, telegram: TelegramService) {
    this.db = db;
    this.telegram = telegram;
  }

  startMonitoring(): void {
    // Controlla ogni 2 minuti
    setInterval(async () => {
      await this.checkLastHeartbeat();
    }, 120000);
    
    console.log('🔍 Monitoraggio attivo (ogni 2 min)');
  }

  private async checkLastHeartbeat(): Promise<void> {
    try {
      // QUERY SEMPLICE AL DATABASE
      const lastHeartbeat = await this.db.getLastHeartbeat();
      
      if (!lastHeartbeat) {
        console.log('⚠️ Nessun heartbeat trovato');
        return;
      }

      const now = new Date();
      const lastHeartbeatTime = new Date(lastHeartbeat.timestamp);
      const timeDiff = now.getTime() - lastHeartbeatTime.getTime();
      const minutesDiff = Math.round(timeDiff / 60000);
      
      const threshold = parseInt(process.env.DOWNTIME_THRESHOLD || '1200000');
      
      console.log(`🔍 Ultimo heartbeat: ${minutesDiff} min fa`);

      if (timeDiff > threshold) {
        // OFFLINE - manda notifica se è la prima volta
        if (!this.isCurrentlyOffline) {
          this.isCurrentlyOffline = true;
          this.offlineStartTime = now;
          
          console.log('🚨 CORRENTE OFFLINE RILEVATA!');
          
          await this.telegram.sendPowerOffAlert(
            lastHeartbeatTime.toLocaleString('it-IT')
          );
        }
      } else {
        // ONLINE - manda notifica di ripristino se era offline
        if (this.isCurrentlyOffline && this.offlineStartTime) {
          const downtimeMs = now.getTime() - this.offlineStartTime.getTime();
          const downtimeMinutes = Math.round(downtimeMs / 60000);
          
          console.log('✅ CORRENTE RIPRISTINATA!');
          
          await this.telegram.sendPowerOnAlert(downtimeMinutes);
          
          this.isCurrentlyOffline = false;
          this.offlineStartTime = null;
        }
      }
      
    } catch (error) {
      console.error('❌ Errore controllo heartbeat:', error);
    }
  }

  getStatus() {
    return {
      isOffline: this.isCurrentlyOffline,
      offlineStartTime: this.offlineStartTime?.toISOString() || null,
      threshold: parseInt(process.env.DOWNTIME_THRESHOLD || '1200000')
    };
  }
}
