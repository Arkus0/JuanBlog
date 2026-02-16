import { beforeAll, describe, expect, it } from 'vitest';

beforeAll(() => {
  process.env.NODE_ENV = 'test';
  process.env.TELEGRAM_BOT_TOKEN = 'x';
  process.env.TELEGRAM_WEBHOOK_SECRET = 'x';
  process.env.OPENAI_API_KEY = 'x';
  process.env.ANTHROPIC_API_KEY = 'x';
  process.env.WP_BASE_URL = 'https://example.com';
  process.env.WP_USERNAME = 'u';
  process.env.WP_APP_PASSWORD = 'p';
  process.env.DATABASE_PATH = ':memory:';
});

describe('db repositories', async () => {
  const { initDb } = await import('../src/db/client');
  const { createArticle, addIdea, listIdeas } = await import('../src/db/repositories');

  initDb();

  it('crea artículo y guarda ideas', () => {
    const article = createArticle(1000);
    addIdea(article.id, 'idea 1');
    addIdea(article.id, 'idea 2');

    const ideas = listIdeas(article.id);
    expect(ideas).toHaveLength(2);
  });
});
