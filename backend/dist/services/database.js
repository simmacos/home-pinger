"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseService = void 0;
const path_1 = __importDefault(require("path"));
const { Low, JSONFile } = require('lowdb');
class DatabaseService {
    constructor() {
        const filePath = path_1.default.resolve(__dirname, '../data/db.json');
        const adapter = new JSONFile(filePath);
        this.db = new Low(adapter);
    }
    async init() {
        var _a;
        await this.db.read();
        (_a = this.db).data || (_a.data = {
            heartbeats: [],
            lastPing: null,
            stats: {
                totalHeartbeats: 0,
                startTime: new Date().toISOString()
            }
        });
        await this.db.write();
        console.log('📊 Database inizializzato');
    }
    async saveHeartbeat(heartbeat) {
        await this.db.read();
        if (!this.db.data) {
            await this.init();
        }
        this.db.data.heartbeats.push(heartbeat);
        this.db.data.lastPing = heartbeat.timestamp;
        this.db.data.stats.totalHeartbeats++;
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        this.db.data.heartbeats = this.db.data.heartbeats.filter((h) => new Date(h.timestamp) > thirtyDaysAgo);
        await this.db.write();
    }
    async getLastHeartbeat() {
        await this.db.read();
        if (!this.db.data || !this.db.data.heartbeats)
            return null;
        const heartbeats = this.db.data.heartbeats;
        const lastHeartbeat = heartbeats[heartbeats.length - 1];
        return lastHeartbeat || null;
    }
    async getHeartbeatsLastMonth() {
        await this.db.read();
        if (!this.db.data || !this.db.data.heartbeats)
            return [];
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return this.db.data.heartbeats.filter((h) => new Date(h.timestamp) > thirtyDaysAgo);
    }
    async getUptimeData(days = 7) {
        await this.db.read();
        if (!this.db.data || !this.db.data.heartbeats) {
            return [];
        }
        const heartbeats = this.db.data.heartbeats;
        const dailyCount = {};
        for (let i = 0; i < days; i++) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateKey = date.toISOString().split('T')[0];
            if (dateKey) {
                dailyCount[dateKey] = 0;
            }
        }
        heartbeats.forEach((heartbeat) => {
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
        const expectedPerDay = 8640;
        const result = [];
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
exports.DatabaseService = DatabaseService;
//# sourceMappingURL=database.js.map