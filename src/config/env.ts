import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(3000),
  DATABASE_PATH: z.string().default('juanblog.db'),
  TELEGRAM_BOT_TOKEN: z.string().min(1),
  TELEGRAM_WEBHOOK_SECRET: z.string().min(1),
  OPENAI_API_KEY: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
  KIMI_API_KEY: z.string().optional(),
  OPENROUTER_API_KEY: z.string().optional(),
  KIMI_BASE_URL: z.string().default('https://openrouter.ai/api/v1'),
  GROK_API_KEY: z.string().optional(),
  // Blogger - opcionales para modo prueba
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_REFRESH_TOKEN: z.string().optional(),
  BLOGGER_BLOG_ID: z.string().optional(),
  WP_BASE_URL: z.string().url().optional(),
  WP_USERNAME: z.string().optional(),
  WP_APP_PASSWORD: z.string().optional()
});

export type AppConfig = z.infer<typeof envSchema>;

export const config: AppConfig = envSchema.parse(process.env);
