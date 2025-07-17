"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MonitoringService = void 0;
class MonitoringService {
    constructor(db, telegram) {
        this.isCurrentlyOffline = false;
        this.offlineStartTime = null;
        this.db = db;
        this.telegram = telegram;
    }
    startMonitoring() {
        setInterval(async () => {
            await this.checkLastHeartbeat();
        }, 120000);
        console.log('🔍 Monitoraggio attivo (ogni 2 min)');
    }
    async checkLastHeartbeat() {
        try {
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
                if (!this.isCurrentlyOffline) {
                    this.isCurrentlyOffline = true;
                    this.offlineStartTime = now;
                    console.log('🚨 CORRENTE OFFLINE RILEVATA!');
                    await this.telegram.sendPowerOffAlert(lastHeartbeatTime.toLocaleString('it-IT'));
                }
            }
            else {
                if (this.isCurrentlyOffline && this.offlineStartTime) {
                    const downtimeMs = now.getTime() - this.offlineStartTime.getTime();
                    const downtimeMinutes = Math.round(downtimeMs / 60000);
                    console.log('✅ CORRENTE RIPRISTINATA!');
                    await this.telegram.sendPowerOnAlert(downtimeMinutes);
                    this.isCurrentlyOffline = false;
                    this.offlineStartTime = null;
                }
            }
        }
        catch (error) {
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
exports.MonitoringService = MonitoringService;
//# sourceMappingURL=monitoring.js.map