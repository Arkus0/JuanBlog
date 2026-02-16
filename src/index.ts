import Fastify from 'fastify';
import { config } from './config';
import { logger } from './logger';
import { initDb } from './db/client';
import { registerTelegramWebhook } from './routes/telegramWebhook';

async function main() {
  initDb();
  const app = Fastify({ logger });

  app.get('/health', async () => ({ ok: true }));
  await registerTelegramWebhook(app);

  await app.listen({ port: config.PORT, host: '0.0.0.0' });
  logger.info({ port: config.PORT }, 'Servidor iniciado');
}

main().catch((error) => {
  logger.error({ err: error }, 'Fallo fatal al iniciar');
  process.exit(1);
});
