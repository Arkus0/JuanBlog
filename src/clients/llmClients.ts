import OpenAI from 'openai';
import { config } from '../config/env';
import { withRetry } from '../utils/retry';

const openai = new OpenAI({ apiKey: config.OPENAI_API_KEY });
const kimiApiKey = config.KIMI_API_KEY ?? config.OPENROUTER_API_KEY;
const kimi = new OpenAI({
  apiKey: kimiApiKey,
  baseURL: config.KIMI_BASE_URL
});

async function askOpenAI(prompt: string, model = 'gpt-4o-mini'): Promise<string> {
  return withRetry(async () => {
    const result = await openai.responses.create({ model, input: prompt });
    return result.output_text;
  });
}

async function askClaude(prompt: string, model = 'claude-3-5-sonnet-latest'): Promise<string> {
  return withRetry(async () => {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': config.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        model,
        max_tokens: 2200,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    if (!response.ok) {
      throw new Error(`Claude HTTP ${response.status}: ${await response.text()}`);
    }
    const json = (await response.json()) as { content: Array<{ type: string; text?: string }> };
    const text = json.content.find((block) => block.type === 'text')?.text;
    if (!text) throw new Error('Claude no devolvió texto.');
    return text;
  });
}

async function askKimi(prompt: string): Promise<string> {
  if (!kimiApiKey) throw new Error('KIMI_API_KEY/OPENROUTER_API_KEY requerido para Kimi provider.');

  return withRetry(async () => {
    const completion = await kimi.chat.completions.create({
      model: 'moonshotai/kimi-k2:free',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7
    });
    return completion.choices[0]?.message?.content ?? '';
  });
}

export const llmClients = {
  askOpenAI,
  askClaude,
  askKimi
};
