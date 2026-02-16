import { config } from '../config/env';
import { logger } from '../logger';
import { BloggerPublisher } from './bloggerPublisher';
import { MockPublisher } from './mockPublisher';
import { Publisher } from './types';

// Detectar si tenemos configuración de Blogger completa
const hasBloggerConfig = Boolean(
  config.GOOGLE_CLIENT_ID &&
  config.GOOGLE_CLIENT_SECRET &&
  config.GOOGLE_REFRESH_TOKEN &&
  config.BLOGGER_BLOG_ID
);

if (hasBloggerConfig) {
  logger.info('Usando BloggerPublisher (modo producción)');
} else {
  logger.info('Usando MockPublisher (modo prueba - sin Blogger)');
  logger.info('Las variables de Blogger no están configuradas. Los posts se guardarán localmente.');
}

export const publisher: Publisher = hasBloggerConfig
  ? new BloggerPublisher()
  : new MockPublisher();
