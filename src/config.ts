import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(3000),
  DATABASE_PATH: z.string().default('juanblog.db'),
  TELEGRAM_BOT_TOKEN: z.string().min(1),
  TELEGRAM_WEBHOOK_SECRET: z.string().min(1),
  OPENAI_API_KEY: z.string().min(1),
  ANTHROPIC_API_KEY: z.string().min(1),
  KIMI_API_KEY: z.string().optional(),
  OPENROUTER_API_KEY: z.string().optional(),
  KIMI_BASE_URL: z.string().default('https://openrouter.ai/api/v1'),
  WP_BASE_URL: z.string().url(),
  WP_USERNAME: z.string().min(1),
  WP_APP_PASSWORD: z.string().min(1)
});

export type AppConfig = z.infer<typeof envSchema>;

export const config: AppConfig = envSchema.parse(process.env);
