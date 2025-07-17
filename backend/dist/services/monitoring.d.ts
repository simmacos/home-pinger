import { DatabaseService } from './database';
import { TelegramService } from './telegram';
export declare class MonitoringService {
    private db;
    private telegram;
    private isCurrentlyOffline;
    private offlineStartTime;
    constructor(db: DatabaseService, telegram: TelegramService);
    startMonitoring(): void;
    private checkLastHeartbeat;
    getStatus(): {
        isOffline: boolean;
        offlineStartTime: string | null;
        threshold: number;
    };
}
//# sourceMappingURL=monitoring.d.ts.map