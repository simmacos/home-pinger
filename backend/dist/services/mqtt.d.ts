import { Server } from 'socket.io';
import { DatabaseService } from './database';
export declare class MqttService {
    private client;
    private io;
    private isConnected;
    private db;
    private lastHeartbeat;
    private reconnectAttempts;
    private readonly maxReconnectAttempts;
    private readonly config;
    constructor(db: DatabaseService);
    setSocketIO(io: Server): void;
    connect(): Promise<void>;
    private handleMessage;
    private isValidHeartbeat;
    private processHeartbeat;
    getStatus(): {
        connected: boolean;
        host: string;
        port: number;
        topic: string;
        clientId: string;
        lastHeartbeat: string | null;
        reconnectAttempts: number;
    };
    getStats(): {
        connected: boolean;
        lastHeartbeat: Date | null;
        timeSinceLastHeartbeat: number | null;
        reconnectAttempts: number;
    };
    disconnect(): void;
}
//# sourceMappingURL=mqtt.d.ts.map