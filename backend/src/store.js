import { randomUUID } from 'node:crypto';
import { config, modes } from './config.js';
import { createUserModel } from './models/user.js';

// Penyimpanan in-memory untuk development tanpa Redis. Hilang saat server restart.
function memoryKv() {
  const data = new Map();
  const live = (key) => {
    const entry = data.get(key);
    if (entry?.expiresAt && entry.expiresAt <= Date.now()) {
      data.delete(key);
      return undefined;
    }
    return entry;
  };
  const setSet = (key, fn) => {
    const entry = live(key);
    const set = entry?.value instanceof Set ? entry.value : new Set();
    const result = fn(set);
    data.set(key, { value: set, expiresAt: entry?.expiresAt });
    return result;
  };
  return {
    async get(key) { return live(key)?.value ?? null; },
    async set(key, value, ttlSeconds) { data.set(key, { value: String(value), expiresAt: ttlSeconds ? Date.now() + ttlSeconds * 1000 : undefined }); },
    async incr(key) {
      const entry = live(key);
      const value = Number(entry?.value || 0) + 1;
      data.set(key, { value: String(value), expiresAt: entry?.expiresAt });
      return value;
    },
    async incrby(key, amount) {
      const entry = live(key);
      const value = Number(entry?.value || 0) + amount;
      data.set(key, { value: String(value), expiresAt: entry?.expiresAt });
      return value;
    },
    async expire(key, ttlSeconds) { const entry = live(key); if (entry) entry.expiresAt = Date.now() + ttlSeconds * 1000; },
    async sadd(key, member) { return setSet(key, (set) => (set.has(member) ? 0 : (set.add(member), 1))); },
    async srem(key, member) { return setSet(key, (set) => (set.delete(member) ? 1 : 0)); },
    async smembers(key) { const value = live(key)?.value; return value instanceof Set ? [...value] : []; },
    async del(key) { data.delete(key); },
  };
}

function redisKv(redis) {
  return {
    get: (key) => redis.get(key),
    set: (key, value, ttlSeconds) => (ttlSeconds ? redis.set(key, value, 'EX', ttlSeconds) : redis.set(key, value)),
    incr: (key) => redis.incr(key),
    incrby: (key, amount) => redis.incrby(key, amount),
    expire: (key, ttlSeconds) => redis.expire(key, ttlSeconds),
    sadd: (key, member) => redis.sadd(key, member),
    srem: (key, member) => redis.srem(key, member),
    smembers: (key) => redis.smembers(key),
    del: (key) => redis.del(key),
    quit: () => redis.quit(),
  };
}

// Bentuk baris sama dengan tabel PostgreSQL (snake_case) agar route tidak peduli sumbernya.
function memoryUsers() {
  const byId = new Map();
  const find = (id) => byId.get(id) || null;
  return {
    async createUser({ googleId, email, name, avatar, tier = 'free' }) {
      const user = { id: randomUUID(), google_id: googleId, email, name, avatar, tier, billing_cycle: null, current_period_end: null, cancel_at_period_end: false, created_at: new Date().toISOString() };
      byId.set(user.id, user);
      return user;
    },
    async getUserByGoogleId(googleId) { return [...byId.values()].find((user) => user.google_id === googleId) || null; },
    async getUserById(id) { return find(id); },
    async updateTier(id, tier, billingCycle = null, currentPeriodEnd = null) {
      const user = find(id);
      if (user) Object.assign(user, { tier, billing_cycle: billingCycle, current_period_end: currentPeriodEnd, cancel_at_period_end: false });
      return user;
    },
    async updateSubscription(id, { cancelAtPeriodEnd }) {
      const user = find(id);
      if (user) user.cancel_at_period_end = cancelAtPeriodEnd;
      return user;
    },
    async deleteUser(id) { return byId.delete(id); },
  };
}

// Redis/PostgreSQL yang dikonfigurasi tapi tidak bisa dihubungi = gagal start. Tidak ada fallback diam-diam.
export async function initStore() {
  let kv;
  if (config.REDIS_URL) {
    const { default: Redis } = await import('ioredis');
    const redis = new Redis(config.REDIS_URL, { lazyConnect: true, maxRetriesPerRequest: 2 });
    await redis.connect();
    kv = redisKv(redis);
  } else {
    kv = memoryKv();
  }

  let users;
  if (config.DATABASE_URL) {
    const db = await import('./utils/database.js');
    await db.initDatabase();
    users = createUserModel({ query: db.query });
  } else {
    users = memoryUsers();
  }
  return { kv, users };
}

export function createMemoryStore() {
  return { kv: memoryKv(), users: memoryUsers() };
}

// Kunci cache memuat mode YouTube agar data mock tidak pernah tersaji sebagai data asli.
export async function cached(kv, key, ttlSeconds, load) {
  const fullKey = `cache:${modes.youtube}:${key}`;
  const hit = await kv.get(fullKey);
  if (hit) return JSON.parse(hit);
  const value = await load();
  if (value != null) await kv.set(fullKey, JSON.stringify(value), ttlSeconds);
  return value;
}
