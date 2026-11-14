import { config } from '../config.js';

const TIER_LIMITS = {
  free: {
    keywordSearchPerDay: 3,
    aiCreditsPerMonth: 50,
  },
  pro: {
    keywordSearchPerDay: Infinity,
    aiCreditsPerMonth: 1500,
  },
  agency: {
    keywordSearchPerDay: Infinity,
    aiCreditsPerMonth: 6000,
  },
};

export function createRateLimiter(redis) {
  return async function rateLimitMiddleware(req, res, next) {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const tier = req.user.tier || 'free';
    const limits = TIER_LIMITS[tier] || TIER_LIMITS.free;
    const userId = req.user.id;

    const now = new Date();
    const dayKey = `ratelimit:keyword:${userId}:${now.toISOString().slice(0, 10)}`;
    const monthKey = `ratelimit:ai:${userId}:${now.toISOString().slice(0, 7)}`;

    const [keywordCount, aiCount] = await Promise.all([
      redis.get(dayKey).then(Number).catch(() => 0),
      redis.get(monthKey).then(Number).catch(() => 0),
    ]);

    req.rateLimit = {
      tier,
      keyword: { used: keywordCount, limit: limits.keywordSearchPerDay },
      ai: { used: aiCount, limit: limits.aiCreditsPerMonth },
    };

    res.set({
      'X-RateLimit-Keyword-Limit': limits.keywordSearchPerDay,
      'X-RateLimit-Keyword-Remaining': Math.max(0, limits.keywordSearchPerDay - keywordCount),
      'X-RateLimit-AI-Limit': limits.aiCreditsPerMonth,
      'X-RateLimit-AI-Remaining': Math.max(0, limits.aiCreditsPerMonth - aiCount),
    });

    next();
  };
}

export async function checkKeywordQuota(redis, userId, tier) {
  const limits = TIER_LIMITS[tier] || TIER_LIMITS.free;
  if (limits.keywordSearchPerDay === Infinity) return { allowed: true };

  const dayKey = `ratelimit:keyword:${userId}:${new Date().toISOString().slice(0, 10)}`;
  const used = await redis.get(dayKey).then(Number).catch(() => 0);
  
  return {
    allowed: used < limits.keywordSearchPerDay,
    used,
    limit: limits.keywordSearchPerDay,
  };
}

export async function checkAICredits(redis, userId, tier, creditsNeeded = 1) {
  const limits = TIER_LIMITS[tier] || TIER_LIMITS.free;
  if (limits.aiCreditsPerMonth === Infinity) return { allowed: true };

  const monthKey = `ratelimit:ai:${userId}:${new Date().toISOString().slice(0, 7)}`;
  const used = await redis.get(monthKey).then(Number).catch(() => 0);
  
  return {
    allowed: used + creditsNeeded <= limits.aiCreditsPerMonth,
    used,
    limit: limits.aiCreditsPerMonth,
  };
}

export async function incrementKeywordUsage(redis, userId) {
  const dayKey = `ratelimit:keyword:${userId}:${new Date().toISOString().slice(0, 10)}`;
  const count = await redis.incr(dayKey);
  if (count === 1) {
    await redis.expire(dayKey, 86400); // 24 hours
  }
  return count;
}

export async function incrementAIUsage(redis, userId, credits = 1) {
  const monthKey = `ratelimit:ai:${userId}:${new Date().toISOString().slice(0, 7)}`;
  const count = await redis.incrby(monthKey, credits);
  if (count === credits) {
    // Expire at end of month
    const now = new Date();
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    const ttl = Math.ceil((endOfMonth - now) / 1000);
    await redis.expire(monthKey, ttl);
  }
  return count;
}