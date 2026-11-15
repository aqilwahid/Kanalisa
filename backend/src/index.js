import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config, modes } from './config.js';
import { initStore } from './store.js';
import { getQuotaUsage } from './utils/quota.js';

import videoRoutes from './routes/video.js';
import keywordRoutes from './routes/keyword.js';
import aiRoutes from './routes/ai.js';
import authRoutes from './routes/auth.js';
import billingRoutes from './routes/billing.js';
import userRoutes from './routes/user.js';

const app = express();

// Security headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// CORS dinamis: mendukung web frontend dan Chrome Extension di development & production
const allowedOrigins = new Set([
  config.FRONTEND_URL,
  ...config.ALLOWED_ORIGINS,
]);

app.use(cors({
  origin: (origin, callback) => {
    // Permintaan tanpa origin header (curl, mobile, extension background) selalu diizinkan
    if (!origin) return callback(null, true);

    // Di development: izinkan semua origin chrome-extension:// dan localhost
    if (config.NODE_ENV !== 'production') {
      if (origin.startsWith('chrome-extension://') || /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
        return callback(null, true);
      }
    }

    if (allowedOrigins.has(origin)) {
      return callback(null, true);
    }

    // Tolak origin yang tidak terdaftar
    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
}));

// Body parser
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// Tangani JSON parse error dengan status 400 (bukan 500)
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ error: 'Format JSON pada request body tidak valid' });
  }
  next(err);
});

// Inisialisasi storage (Redis / Memory KV & Postgres / Memory Users)
let storeInstance = null;

async function getStore() {
  if (!storeInstance) {
    storeInstance = await initStore();
  }
  return storeInstance;
}

// In-memory keyword cache model
const memoryKeywordCache = new Map();
const keywordCacheModel = {
  async get(query) {
    const key = query.toLowerCase().trim();
    const entry = memoryKeywordCache.get(key);
    if (entry && entry.expiresAt > Date.now()) {
      return entry.results;
    }
    return null;
  },
  async set(query, results, ttlHours = 24) {
    const key = query.toLowerCase().trim();
    const expiresAt = Date.now() + ttlHours * 3600 * 1000;
    memoryKeywordCache.set(key, { results, expiresAt });
    return results;
  },
};

// Middleware injection storage ke request
app.use(async (req, res, next) => {
  try {
    const store = await getStore();
    req.redis = store.kv;
    req.userModel = store.users;
    req.keywordCache = keywordCacheModel;
    next();
  } catch (err) {
    console.error('Store initialization error:', err);
    res.status(500).json({ error: 'Gagal menginisialisasi penyimpanan backend' });
  }
});

// Endpoint status dan health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'kanalisa-api',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: Math.round(process.uptime()),
    modes: {
      youtube: modes.youtube,
      auth: modes.auth,
      ai: modes.ai,
      database: modes.database,
      cache: modes.cache,
      billing: modes.billing,
    },
  });
});

app.get('/api/quota', (req, res) => {
  res.json(getQuotaUsage());
});

// Routing
app.use('/api/video', videoRoutes);
app.use('/api/keyword', keywordRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/user', userRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint tidak ditemukan' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

let server = null;
if (process.env.NODE_ENV !== 'test') {
  server = app.listen(config.PORT, '0.0.0.0', () => {
    console.log(`🚀 Kanalisa API running on http://localhost:${config.PORT}`);
    console.log(`   Environment: ${config.NODE_ENV}`);
    console.log(`   Modes: YouTube=${modes.youtube}, Auth=${modes.auth}, AI=${modes.ai}, DB=${modes.database}, Cache=${modes.cache}`);
  });

  const shutdown = async () => {
    console.log('Shutting down server gracefully...');
    if (server) {
      server.close(() => {
        process.exit(0);
      });
    }
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

export default app;
