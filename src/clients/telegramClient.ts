import { config } from '../config/env';
import { withRetry } from '../utils/retry';

export interface TelegramUpdate {
  update_id: number;
  message?: {
    message_id: number;
    text?: string;
    chat: { id: number };
  };
}

export async function sendTelegramMessage(chatId: number, text: string): Promise<void> {
  await withRetry(async () => {
    const res = await fetch(`https://api.telegram.org/bot${config.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'Markdown'
      })
    });
    if (!res.ok) throw new Error(`Telegram sendMessage ${res.status}: ${await res.text()}`);
  });
}
