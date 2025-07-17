"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const telegram_1 = require("./telegram");
async function testTelegram() {
    console.log('🧪 Test Telegram');
    console.log('Token:', process.env.TELEGRAM_BOT_TOKEN ? 'OK' : 'MANCANTE');
    console.log('Chat ID:', process.env.TELEGRAM_CHAT_ID ? 'OK' : 'MANCANTE');
    const telegram = new telegram_1.TelegramService();
    await telegram.sendAlert('🧪 Test messaggio dal backend!');
}
testTelegram();
//# sourceMappingURL=test-telegram.js.map