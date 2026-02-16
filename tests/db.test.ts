import { beforeAll, describe, expect, it } from 'vitest';

beforeAll(() => {
  process.env.NODE_ENV = 'test';
  process.env.TELEGRAM_BOT_TOKEN = 'x';
  process.env.TELEGRAM_WEBHOOK_SECRET = 'x';
  process.env.OPENAI_API_KEY = 'x';
  process.env.ANTHROPIC_API_KEY = 'x';
  process.env.GOOGLE_CLIENT_ID = 'gid';
  process.env.GOOGLE_CLIENT_SECRET = 'gsecret';
  process.env.GOOGLE_REFRESH_TOKEN = 'grefresh';
  process.env.BLOGGER_BLOG_ID = '123456';
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
