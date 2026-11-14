import { z } from 'zod';

const envSchema = z.object({
  PORT: z.coerce.number().default(3000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  YOUTUBE_API_KEY: z.string().min(1).default('test-key'),
  JWT_SECRET: z.string().min(32).default('test-secret-key-min-32-chars-long'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  REDIS_URL: z.string().url().default('redis://localhost:6379'),
  DATABASE_URL: z.string().url().default('postgresql://user:password@localhost:5432/kanalisa'),
  LLM_API_KEY: z.string().min(1).default('test-llm-key'),
  LLM_MODEL: z.string().default('gpt-4o-mini'),
  PAYMENT_GATEWAY_WEBHOOK_SECRET: z.string().min(1).default('test-webhook-secret'),
  FRONTEND_URL: z.string().url().default('http://localhost:5173'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:');
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const config = parsed.data;