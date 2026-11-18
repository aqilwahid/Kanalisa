import express from 'express';
import { getKeywordSuggestions, searchKeyword, enrichKeywordResult } from '../services/keyword.js';
import { authMiddleware, optionalAuthMiddleware } from '../middleware/auth.js';
import { checkKeywordQuota, incrementKeywordUsage } from '../middleware/rateLimit.js';

const router = express.Router();

router.get('/search', optionalAuthMiddleware, async (req, res) => {
  try {
    const { q, limit = '10' } = req.query;

    if (!q || typeof q !== 'string' || !q.trim()) {
      return res.status(400).json({ error: 'Parameter "q" (kata kunci) wajib disertakan' });
    }

    const cleanQuery = q.trim();
    const userId = req.user ? req.user.id : `anon:${req.ip || 'local'}`;
    const tier = req.user ? req.user.tier : 'free';

    const quotaCheck = await checkKeywordQuota(req.redis, userId, tier);
    if (!quotaCheck.allowed) {
      return res.status(429).json({
        error: 'Batas kuota harian riset kata kunci telah tercapai (3x/hari untuk paket Gratis).',
        used: quotaCheck.used,
        limit: quotaCheck.limit,
        resetAt: new Date(Date.now() + 86400000).toISOString(),
      });
    }

    const result = await getKeywordSuggestions(cleanQuery, {
      keywordCache: req.keywordCache,
      tier,
    });

    const parsedLimit = Math.min(20, Math.max(1, parseInt(limit, 10) || 10));
    const limitedResults = {
      ...result,
      relatedKeywords: (result.relatedKeywords || []).slice(0, parsedLimit),
    };

    const used = await incrementKeywordUsage(req.redis, userId);
    const limitForTier = quotaCheck.limit ?? null;

    res.json({
      ...limitedResults,
      keywordUsage: { used: limitForTier === null ? null : used, limit: limitForTier },
    });
  } catch (err) {
    console.error('Keyword search error:', err.message);
    res.status(500).json({ error: 'Gagal melakukan riset kata kunci' });
  }
});

router.get('/related', optionalAuthMiddleware, async (req, res) => {
  try {
    const { q, limit = '10' } = req.query;

    if (!q || typeof q !== 'string' || !q.trim()) {
      return res.status(400).json({ error: 'Parameter "q" wajib disertakan' });
    }

    const cleanQuery = q.trim();
    const userId = req.user ? req.user.id : `anon:${req.ip || 'local'}`;
    const tier = req.user ? req.user.tier : 'free';

    const quotaCheck = await checkKeywordQuota(req.redis, userId, tier);
    if (!quotaCheck.allowed) {
      return res.status(429).json({
        error: 'Batas kuota harian riset kata kunci telah tercapai.',
        used: quotaCheck.used,
        limit: quotaCheck.limit,
      });
    }

    const baseResult = await searchKeyword(cleanQuery, {
      keywordCache: req.keywordCache,
    });
    const enriched = enrichKeywordResult(baseResult);

    await incrementKeywordUsage(req.redis, userId);

    const parsedLimit = Math.min(20, Math.max(1, parseInt(limit, 10) || 10));
    res.json({
      query: cleanQuery,
      relatedKeywords: (enriched.relatedKeywords || []).slice(0, parsedLimit),
    });
  } catch (err) {
    console.error('Related keywords error:', err.message);
    res.status(500).json({ error: 'Gagal memuat kata kunci terkait' });
  }
});

router.post('/save', authMiddleware, async (req, res) => {
  try {
    const { keyword } = req.body;

    if (!keyword || typeof keyword !== 'string' || !keyword.trim()) {
      return res.status(400).json({ error: 'Kata kunci wajib disertakan' });
    }

    const cleanKw = keyword.trim();
    const userId = req.user.id;
    const savedKey = `user:${userId}:saved_keywords`;
    const saved = await req.redis.smembers(savedKey);

    const maxSaved = req.user.tier === 'agency' ? 500 : 200;
    if (saved.length >= maxSaved) {
      return res.status(400).json({ error: `Batas maksimal simpan kata kunci (${maxSaved}) telah tercapai` });
    }

    if (saved.includes(cleanKw)) {
      return res.status(409).json({ error: 'Kata kunci sudah tersimpan' });
    }

    await req.redis.sadd(savedKey, cleanKw);

    res.json({ success: true, keyword: cleanKw });
  } catch (err) {
    console.error('Save keyword error:', err.message);
    res.status(500).json({ error: 'Gagal menyimpan kata kunci' });
  }
});

router.get('/saved', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const savedKey = `user:${userId}:saved_keywords`;
    const saved = await req.redis.smembers(savedKey);

    res.json({ keywords: saved || [] });
  } catch (err) {
    console.error('Get saved keywords error:', err.message);
    res.status(500).json({ error: 'Gagal memuat daftar kata kunci tersimpan' });
  }
});

router.delete('/saved/:keyword', authMiddleware, async (req, res) => {
  try {
    const { keyword } = req.params;
    const userId = req.user.id;
    const savedKey = `user:${userId}:saved_keywords`;

    await req.redis.srem(savedKey, keyword);

    res.json({ success: true });
  } catch (err) {
    console.error('Delete saved keyword error:', err.message);
    res.status(500).json({ error: 'Gagal menghapus kata kunci tersimpan' });
  }
});

export default router;
