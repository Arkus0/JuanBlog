import { beforeEach, describe, expect, it, vi } from 'vitest';

process.env.NODE_ENV = 'test';
process.env.TELEGRAM_BOT_TOKEN = 'x';
process.env.TELEGRAM_WEBHOOK_SECRET = 'x';
process.env.OPENAI_API_KEY = 'x';
process.env.ANTHROPIC_API_KEY = 'x';
process.env.KIMI_API_KEY = 'x';
process.env.GOOGLE_CLIENT_ID = 'gid';
process.env.GOOGLE_CLIENT_SECRET = 'gsecret';
process.env.GOOGLE_REFRESH_TOKEN = 'grefresh';
process.env.BLOGGER_BLOG_ID = '123456';
process.env.DATABASE_PATH = ':memory:';

vi.mock('../src/pipeline/contentPipeline', () => ({
  classifyTopic: vi.fn().mockResolvedValue('tecnologia'),
  generateDraft: vi.fn().mockResolvedValue({
    title: 'Titulo',
    slug: 'titulo',
    meta_description: 'meta description suficientemente larga para la validación',
    tags: ['tech', 'blog'],
    topic_label: 'tecnologia',
    target_words: 1000,
    content_markdown:
      '# Titulo\n\n## A\nTexto\n\n## B\nTexto\n\n## Conclusión\nTexto\n\n## Notas / Claims a verificar\n- ninguna',
    claims_to_verify: []
  })
}));

vi.mock('../src/publishers', () => ({
  publisher: {
    upsertDraft: vi
      .fn()
      .mockResolvedValue({ remotePostId: 321, viewUrl: 'https://blog/view', selfLink: 'https://api/blog/321' }),
    publish: vi.fn().mockResolvedValue({ remotePostId: 321, viewUrl: 'https://blog/publicado' }),
    getPostLinks: vi.fn().mockResolvedValue({ viewUrl: 'https://blog/publicado' })
  }
}));

describe('publisher flow', async () => {
  const { initDb, db } = await import('../src/db/client');
  const { createArticle, addIdea, updateArticleState } = await import('../src/db/repositories');
  const { handleDraft, handleApprove } = await import('../src/services/articleService');
  const { publisher } = await import('../src/publishers');
  const mockedPublisher = publisher as any;

  beforeEach(() => {
    initDb();
    db.exec('DELETE FROM ideas; DELETE FROM versions; DELETE FROM articles;');
    vi.clearAllMocks();
  });

  it('envía v2 al publisher y recibe postId', async () => {
    const article = createArticle(1000);
    addIdea(article.id, 'idea de prueba');

    await handleDraft(1000);

    expect(mockedPublisher.upsertDraft).toHaveBeenCalledTimes(1);
    expect(mockedPublisher.upsertDraft).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Titulo',
        remotePostId: null
      })
    );
  });

  it('/approve llama publish', async () => {
    const article = createArticle(1000);
    updateArticleState({ articleId: article.id, wp_post_id: 321 });

    await handleApprove();
    expect(mockedPublisher.publish).toHaveBeenCalledWith(321);
  });

  it('/approve es idempotente si ya está publicado', async () => {
    const article = createArticle(1000);
    updateArticleState({ articleId: article.id, wp_post_id: 321, status: 'PUBLISHED' });

    const msg = await handleApprove();

    expect(mockedPublisher.publish).not.toHaveBeenCalled();
    expect(mockedPublisher.getPostLinks).toHaveBeenCalledWith(321);
    expect(msg).toContain('ya está publicado');
  });
});
