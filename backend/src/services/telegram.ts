// src/services/telegram.ts
import TelegramBot from 'node-telegram-bot-api';
import { config } from 'dotenv';
import path from 'path';

config({ path: path.resolve(__dirname, '../../.env') });


export class TelegramService {
  private bot: TelegramBot | null = null;
  private chatId: string;
  private isEnabled: boolean = false;

  constructor() {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    this.chatId = process.env.TELEGRAM_CHAT_ID || '';
    
    console.log(token);
    console.log(this.chatId);

    if (token && this.chatId) {
      this.bot = new TelegramBot(token, { polling: false });
      this.isEnabled = true;
      console.log('📱 Telegram service attivo');
    } else {
      console.warn('⚠️ Telegram non configurato');
    }
  }

  async sendAlert(message: string): Promise<void> {
    if (!this.isEnabled || !this.bot) {
      console.warn('⚠️ Telegram non disponibile');
      return;
    }

    try {
      await this.bot.sendMessage(this.chatId, message, {
        parse_mode: 'HTML'
      });
      console.log('📱 Alert Telegram inviato');
    } catch (error) {
      console.error('❌ Errore Telegram:', error);
    }
  }

  async sendPowerOffAlert(lastHeartbeat: string): Promise<void> {
    const message = `
🚨 <b>CORRENTE OFFLINE</b> 🚨

🏠 <b>Casa Benevento</b>
⏰ <b>Ora:</b> ${new Date().toLocaleString('it-IT')}
📡 <b>Ultimo heartbeat:</b> ${lastHeartbeat}

⚡ Controllare salvavita!`;
    
    await this.sendAlert(message);
  }

  async sendPowerOnAlert(downtimeMinutes: number): Promise<void> {
    const message = `
✅ <b>CORRENTE RIPRISTINATA</b> ✅

🏠 <b>Casa Benevento</b>
⏰ <b>Ora:</b> ${new Date().toLocaleString('it-IT')}
⚡ <b>Downtime:</b> ${downtimeMinutes} minuti

🎉 Sistema online!`;
    
    await this.sendAlert(message);
  }
}
