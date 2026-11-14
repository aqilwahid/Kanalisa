import pg from 'pg';
import { config } from '../config.js';

const { Pool } = pg;

let pool = null;

export function getPool() {
  if (!pool) {
    pool = new Pool({
      connectionString: config.DATABASE_URL,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    pool.on('error', (err) => {
      console.error('Unexpected database pool error:', err);
    });

    pool.on('connect', () => {
      console.log('Database connected');
    });
  }
  return pool;
}

export async function query(text, params) {
  const pool = getPool();
  const start = Date.now();
  const result = await pool.query(text, params);
  const duration = Date.now() - start;
  console.log('Executed query', { text: text.substring(0, 100), duration, rows: result.rowCount });
  return result;
}

export async function getClient() {
  const pool = getPool();
  return pool.connect();
}

export async function closePool() {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

export async function initDatabase() {
  const pool = getPool();
  
  // Create users table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      google_id TEXT UNIQUE NOT NULL,
      email TEXT NOT NULL,
      name TEXT,
      avatar TEXT,
      tier TEXT DEFAULT 'free',
      billing_cycle TEXT,
      current_period_end TIMESTAMP,
      cancel_at_period_end BOOLEAN DEFAULT FALSE,
      ai_credits INT DEFAULT 50,
      keyword_quota INT DEFAULT 3,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `);

  // Create keyword_cache table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS keyword_cache (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      query TEXT NOT NULL,
      normalized_query TEXT UNIQUE NOT NULL,
      results JSONB NOT NULL,
      expires_at TIMESTAMP NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);

  // Create index for faster lookups
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_keyword_cache_normalized_query 
    ON keyword_cache(normalized_query)
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_keyword_cache_expires_at 
    ON keyword_cache(expires_at)
  `);

  console.log('Database tables initialized');
}