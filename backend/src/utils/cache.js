import Redis from 'ioredis';
import { config } from '../config.js';

let redisClient = null;

export function getRedis() {
  if (!redisClient) {
    redisClient = new Redis(config.REDIS_URL, {
      maxRetriesPerRequest: 3,
      retryDelayOnFailover: 100,
      enableReadyCheck: true,
      lazyConnect: true,
    });
    
    redisClient.on('error', (err) => {
      console.error('Redis connection error:', err.message);
    });
    
    redisClient.on('connect', () => {
      console.log('Redis connected');
    });
  }
  
  return redisClient;
}

export async function connectRedis() {
  const client = getRedis();
  if (client.status === 'wait') {
    await client.connect();
  }
  return client;
}

export async function disconnectRedis() {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
  }
}

const TTL = {
  video: 15 * 60,
  keyword: 24 * 60 * 60,
  channel: 24 * 60 * 60,
  search: 60 * 60,
  user: 60 * 60,
};

export async function cacheGet(redis, key) {
  try {
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

export async function cacheSet(redis, key, value, ttl = TTL.video) {
  try {
    await redis.setex(key, ttl, JSON.stringify(value));
    return true;
  } catch (err) {
    console.error('Cache set error:', err.message);
    return false;
  }
}

export async function cacheDel(redis, key) {
  try {
    await redis.del(key);
    return true;
  } catch {
    return false;
  }
}

export async function cacheMGet(redis, keys) {
  if (!keys.length) return [];
  try {
    const values = await redis.mget(...keys);
    return values.map(v => v ? JSON.parse(v) : null);
  } catch {
    return keys.map(() => null);
  }
}

export async function cacheMSet(redis, entries, ttl = TTL.video) {
  if (!entries.length) return;
  const pipeline = redis.pipeline();
  for (const [key, value] of entries) {
    pipeline.setex(key, ttl, JSON.stringify(value));
  }
  await pipeline.exec();
}

export function makeVideoCacheKey(videoId) {
  return `cache:video:${videoId}`;
}

export function makeChannelCacheKey(channelId) {
  return `cache:channel:${channelId}`;
}

export function makeKeywordCacheKey(query) {
  return `cache:keyword:${query.toLowerCase().trim()}`;
}

export function makeSearchCacheKey(query, page = 1) {
  return `cache:search:${query.toLowerCase().trim()}:${page}`;
}