import { beforeAll, describe, expect, it, vi } from 'vitest';

beforeAll(() => {
  process.env.NODE_ENV = 'test';
  process.env.TELEGRAM_BOT_TOKEN = 'x';
  process.env.TELEGRAM_WEBHOOK_SECRET = 'x';
  process.env.OPENAI_API_KEY = 'x';
  process.env.ANTHROPIC_API_KEY = 'x';
  process.env.KIMI_API_KEY = 'x';
  process.env.WP_BASE_URL = 'https://example.com';
  process.env.WP_USERNAME = 'u';
  process.env.WP_APP_PASSWORD = 'p';
});

describe('classifyTopic', async () => {
  const { llmClients } = await import('../src/clients/llmClients');
  const { classifyTopic } = await import('../src/pipeline/contentPipeline');

  it('cae en mixto cuando respuesta no válida', async () => {
    vi.spyOn(llmClients, 'askOpenAI').mockResolvedValueOnce('cualquier_cosa');
    await expect(classifyTopic('ideas')).resolves.toBe('mixto');
  });
});
