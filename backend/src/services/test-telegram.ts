// test-telegram.ts
import 'dotenv/config';
import { TelegramService } from './telegram';

async function testTelegram() {
  console.log('🧪 Test Telegram');
  console.log('Token:', process.env.TELEGRAM_BOT_TOKEN ? 'OK' : 'MANCANTE');
  console.log('Chat ID:', process.env.TELEGRAM_CHAT_ID ? 'OK' : 'MANCANTE');
  
  const telegram = new TelegramService();
  await telegram.sendAlert('🧪 Test messaggio dal backend!');
}

testTelegram();
