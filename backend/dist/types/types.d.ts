export interface HeartbeatData {
    device: string;
    counter: number;
    uptime: number;
    ip: string;
    rssi: number;
    timestamp: number;
}
export interface HeartbeatRecord {
    id: string;
    timestamp: string;
    data: HeartbeatData;
    status: 'online' | 'offline';
}
export interface DatabaseSchema {
    heartbeats: HeartbeatRecord[];
    lastPing: string | null;
    stats: {
        totalHeartbeats: number;
        startTime: string;
    };
}
//# sourceMappingURL=types.d.ts.map