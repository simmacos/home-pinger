export declare class TelegramService {
    private bot;
    private chatId;
    private isEnabled;
    constructor();
    sendAlert(message: string): Promise<void>;
    sendPowerOffAlert(lastHeartbeat: string): Promise<void>;
    sendPowerOnAlert(downtimeMinutes: number): Promise<void>;
}
//# sourceMappingURL=telegram.d.ts.map