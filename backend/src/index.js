import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config.js';
import { connectRedis, getRedis } from './utils/cache.js';

import videoRoutes from './routes/video.js';
import keywordRoutes from './routes/keyword.js';
import aiRoutes from './routes/ai.js';
import authRoutes from './routes/auth.js';
import billingRoutes from './routes/billing.js';
import userRoutes from './routes/user.js';

const app = express();

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));
app.use(cors({
  origin: config.FRONTEND_URL,
  credentials: true,
}));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

let redis = null;
let redisConnected = false;

async function initRedis() {
  try {
    redis = await connectRedis();
    redisConnected = true;
    console.log('Redis connected successfully');
  } catch (err) {
    console.warn('Redis connection failed, running in mock mode without Redis:', err.message);
    redisConnected = false;
    // Create a mock Redis client for rate limiting
    redis = createMockRedis();
  }
}

function createMockRedis() {
  const store = new Map();
  return {
    get: async (key) => store.get(key) || null,
    set: async (key, value) => { store.set(key, value); return 'OK'; },
    setex: async (key, ttl, value) => { store.set(key, value); return 'OK'; },
    del: async (key) => { store.delete(key); return 1; },
    incr: async (key) => { const val = (store.get(key) || 0) + 1; store.set(key, val); return val; },
    expire: async (key, ttl) => 1,
    smembers: async (key) => Array.from(store.get(key) || new Set()),
    sadd: async (key, ...members) => { 
      const set = store.get(key) || new Set(); 
      members.forEach(m => set.add(m)); 
      store.set(key, set); 
      return members.length; 
    },
    srem: async (key, member) => { 
      const set = store.get(key) || new Set(); 
      set.delete(member); 
      store.set(key, set); 
      return 1; 
    },
    mget: async (...keys) => keys.map(k => store.get(k) || null),
    pipeline: () => {
      const commands = [];
      return {
        setex: (key, ttl, value) => { commands.push(['setex', key, ttl, value]); return this; },
        exec: async () => { 
          for (const [cmd, key, ttl, value] of commands) {
            if (cmd === 'setex') store.set(key, value);
          }
          return commands.map(() => [null, 'OK']);
        },
      };
    },
    quit: async () => 'OK',
    status: 'ready',
  };
}

app.use(async (req, res, next) => {
  if (!redis) {
    await initRedis();
  }
  req.redis = redis;
  req.db = {
    async getUserByGoogleId(googleId) { return null; },
    async getUserById(id) { return null; },
    async createUser(data) { return { id: 'temp-' + Date.now(), ...data }; },
    async updateUserTier(id, tier, billingCycle, currentPeriodEnd, aiCredits, keywordQuota) { return { id, tier }; },
    async updateUserSubscription(id, data) { return { id, ...data }; },
    async deleteUser(id) { return true; },
  };
  next();
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

import { getQuotaUsage } from './utils/quota.js';

app.get('/api/quota', (req, res) => {
  res.json(getQuotaUsage());
});

app.use('/api/video', videoRoutes);
app.use('/api/keyword', keywordRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/user', userRoutes);

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

const server = app.listen(config.PORT, () => {
  console.log(`🚀 Kanalisa API running on port ${config.PORT}`);
  console.log(`   Environment: ${config.NODE_ENV}`);
  console.log(`   Frontend URL: ${config.FRONTEND_URL}`);
});

process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(async () => {
    await import('./utils/cache.js').then(m => m.disconnectRedis());
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(async () => {
    await import('./utils/cache.js').then(m => m.disconnectRedis());
    process.exit(0);
  });
});

export default app;