import { HeartbeatRecord } from '../types/types';
export declare class DatabaseService {
    private db;
    constructor();
    init(): Promise<void>;
    saveHeartbeat(heartbeat: HeartbeatRecord): Promise<void>;
    getLastHeartbeat(): Promise<HeartbeatRecord | null>;
    getHeartbeatsLastMonth(): Promise<HeartbeatRecord[]>;
    getUptimeData(days?: number): Promise<{
        label: string;
        uptime: string;
    }[]>;
    getStats(): Promise<{
        totalHeartbeats: any;
        lastPing: any;
        dbSize: any;
    }>;
}
//# sourceMappingURL=database.d.ts.map