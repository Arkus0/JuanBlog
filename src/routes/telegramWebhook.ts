import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { config } from '../config';
import { sendTelegramMessage, TelegramUpdate } from '../clients/telegramClient';
import { parseCommand } from '../services/commandParser';
import {
  handleApprove,
  handleDraft,
  handleIdea,
  handleNew,
  handleRevise,
  handleStatus
} from '../services/articleService';
import { logger } from '../logger';

const bodySchema = z.custom<TelegramUpdate>();

export async function registerTelegramWebhook(app: FastifyInstance): Promise<void> {
  app.post('/webhook/telegram', async (req, reply) => {
    const secret = req.headers['x-telegram-bot-api-secret-token'];
    if (secret !== config.TELEGRAM_WEBHOOK_SECRET) {
      reply.code(401).send({ ok: false, error: 'Invalid webhook secret token' });
      return;
    }

    const parsed = bodySchema.safeParse(req.body);
    if (!parsed.success) {
      reply.code(400).send({ ok: false, error: 'Invalid update payload' });
      return;
    }

    const update = parsed.data;
    const text = update.message?.text;
    const chatId = update.message?.chat?.id;

    if (!text || !chatId) {
      reply.code(200).send({ ok: true, ignored: true });
      return;
    }

    try {
      const cmd = parseCommand(text);
      let output = '';
      switch (cmd.kind) {
        case 'idea':
          output = await handleIdea(cmd.text);
          break;
        case 'draft':
          output = await handleDraft(cmd.targetWords);
          break;
        case 'revise':
          output = await handleRevise(cmd.instructions);
          break;
        case 'approve':
          output = await handleApprove();
          break;
        case 'status':
          output = await handleStatus();
          break;
        case 'new':
          output = await handleNew();
          break;
        default:
          output =
            'Comando no reconocido. Usa /idea, /draft [1000|2000], /revise <instrucciones>, /approve, /status o /new.';
      }

      await sendTelegramMessage(chatId, output);
      reply.code(200).send({ ok: true });
    } catch (error) {
      logger.error({ err: error }, 'Error procesando comando de Telegram');
      await sendTelegramMessage(chatId, 'Ocurrió un error procesando tu comando. Revisa logs del servidor.');
      reply.code(200).send({ ok: true, errorHandled: true });
    }
  });
}
