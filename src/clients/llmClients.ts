import OpenAI from 'openai';
import { config } from '../config/env';
import { withRetry } from '../utils/retry';

// Kimi via OpenRouter (GRATIS)
const kimiApiKey = config.KIMI_API_KEY ?? config.OPENROUTER_API_KEY;
const kimi = new OpenAI({
  apiKey: kimiApiKey,
  baseURL: config.KIMI_BASE_URL
});

// Grok via xAI API
const grok = config.GROK_API_KEY
  ? new OpenAI({
      apiKey: config.GROK_API_KEY,
      baseURL: 'https://api.x.ai/v1'
    })
  : null;

async function askKimi(prompt: string, model = 'moonshotai/kimi-k2:free'): Promise<string> {
  if (!kimiApiKey) throw new Error('KIMI_API_KEY u OPENROUTER_API_KEY requerido para Kimi.');

  return withRetry(async () => {
    const completion = await kimi.chat.completions.create({
      model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7
    });
    return completion.choices[0]?.message?.content ?? '';
  });
}

async function askGrok(prompt: string, model = 'grok-2-latest'): Promise<string> {
  if (!grok) throw new Error('GROK_API_KEY requerido para Grok.');

  return withRetry(async () => {
    const completion = await grok.chat.completions.create({
      model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7
    });
    return completion.choices[0]?.message?.content ?? '';
  });
}

// Cliente genérico para OpenAI (compatibilidad hacia atrás)
async function askOpenAI(prompt: string, model = 'gpt-4o-mini'): Promise<string> {
  if (!config.OPENAI_API_KEY) {
    // Fallback a Kimi si no hay OpenAI configurado
    return askKimi(prompt);
  }
  const openai = new OpenAI({ apiKey: config.OPENAI_API_KEY });
  return withRetry(async () => {
    const result = await openai.responses.create({ model, input: prompt });
    return result.output_text;
  });
}

export const llmClients = {
  askKimi,
  askGrok,
  askOpenAI // Mantenido por compatibilidad
};
