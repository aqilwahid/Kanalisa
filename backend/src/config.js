import 'dotenv/config';
import { z } from 'zod';

// Kosong = layanan itu berjalan dalam mode mock. Tidak ada nilai kredensial palsu sebagai default.
const optional = z.string().trim().optional().transform((v) => v || '');

const envSchema = z.object({
  PORT: z.coerce.number().default(3000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  YOUTUBE_API_KEY: optional,
  GOOGLE_CLIENT_ID: optional,
  GOOGLE_CLIENT_SECRET: optional,
  JWT_SECRET: z.string().min(32).optional(),
  JWT_EXPIRES_IN: z.string().default('7d'),
  REDIS_URL: optional,
  DATABASE_URL: optional,
  LLM_API_KEY: optional,
  LLM_MODEL: z.string().default('gpt-4o-mini'),
  LLM_BASE_URL: z.string().url().default('https://api.openai.com/v1'),
  PAYMENT_GATEWAY_WEBHOOK_SECRET: optional,
  FRONTEND_URL: z.string().default('http://localhost:5173'),
  // Daftar origin dipisah koma. Kosong = semua chrome-extension:// (hanya development).
  ALLOWED_ORIGINS: optional,
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:');
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

const env = parsed.data;
const isProd = env.NODE_ENV === 'production';

if (isProd) {
  const missing = ['JWT_SECRET', 'YOUTUBE_API_KEY', 'GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET', 'DATABASE_URL', 'REDIS_URL', 'LLM_API_KEY', 'ALLOWED_ORIGINS']
    .filter((key) => !env[key]);
  if (missing.length) {
    console.error(`❌ Production membutuhkan: ${missing.join(', ')}. Mode mock tidak diizinkan di production.`);
    process.exit(1);
  }
}

export const config = {
  ...env,
  // ponytail: secret dev tetap hanya untuk lokal; production wajib JWT_SECRET (dicek di atas).
  JWT_SECRET: env.JWT_SECRET || 'kanalisa-dev-only-secret-do-not-use-in-production',
  ALLOWED_ORIGINS: env.ALLOWED_ORIGINS.split(',').map((s) => s.trim()).filter(Boolean),
};

// Sumber kebenaran mode tiap layanan. Ditampilkan di /health dan di setiap respons data.
export const modes = {
  youtube: env.YOUTUBE_API_KEY ? 'live' : 'mock',
  auth: env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET ? 'live' : 'mock',
  ai: env.LLM_API_KEY ? 'live' : 'mock',
  database: env.DATABASE_URL ? 'postgres' : 'memory',
  cache: env.REDIS_URL ? 'redis' : 'memory',
  billing: env.PAYMENT_GATEWAY_WEBHOOK_SECRET ? 'live' : 'disabled',
};
