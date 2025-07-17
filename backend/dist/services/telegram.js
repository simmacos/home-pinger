"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TelegramService = void 0;
const node_telegram_bot_api_1 = __importDefault(require("node-telegram-bot-api"));
const dotenv_1 = require("dotenv");
const path_1 = __importDefault(require("path"));
(0, dotenv_1.config)({ path: path_1.default.resolve(__dirname, '../../.env') });
class TelegramService {
    constructor() {
        this.bot = null;
        this.isEnabled = false;
        const token = process.env.TELEGRAM_BOT_TOKEN;
        this.chatId = process.env.TELEGRAM_CHAT_ID || '';
        console.log(token);
        console.log(this.chatId);
        if (token && this.chatId) {
            this.bot = new node_telegram_bot_api_1.default(token, { polling: false });
            this.isEnabled = true;
            console.log('📱 Telegram service attivo');
        }
        else {
            console.warn('⚠️ Telegram non configurato');
        }
    }
    async sendAlert(message) {
        if (!this.isEnabled || !this.bot) {
            console.warn('⚠️ Telegram non disponibile');
            return;
        }
        try {
            await this.bot.sendMessage(this.chatId, message, {
                parse_mode: 'HTML'
            });
            console.log('📱 Alert Telegram inviato');
        }
        catch (error) {
            console.error('❌ Errore Telegram:', error);
        }
    }
    async sendPowerOffAlert(lastHeartbeat) {
        const message = `
🚨 <b>CORRENTE OFFLINE</b> 🚨

🏠 <b>Casa Benevento</b>
⏰ <b>Ora:</b> ${new Date().toLocaleString('it-IT')}
📡 <b>Ultimo heartbeat:</b> ${lastHeartbeat}

⚡ Controllare salvavita!`;
        await this.sendAlert(message);
    }
    async sendPowerOnAlert(downtimeMinutes) {
        const message = `
✅ <b>CORRENTE RIPRISTINATA</b> ✅

🏠 <b>Casa Benevento</b>
⏰ <b>Ora:</b> ${new Date().toLocaleString('it-IT')}
⚡ <b>Downtime:</b> ${downtimeMinutes} minuti

🎉 Sistema online!`;
        await this.sendAlert(message);
    }
}
exports.TelegramService = TelegramService;
//# sourceMappingURL=telegram.js.map