import express from 'express';
import { getKeywordSuggestions, searchKeyword, enrichKeywordResult } from '../services/keyword.js';
import { authMiddleware, optionalAuthMiddleware } from '../middleware/auth.js';
import { checkKeywordQuota, incrementKeywordUsage } from '../middleware/rateLimit.js';

const router = express.Router();

router.get('/search', authMiddleware, async (req, res) => {
  try {
    const { q, limit = '10' } = req.query;
    
    if (!q || typeof q !== 'string') {
      return res.status(400).json({ error: 'Query parameter "q" required' });
    }
    
    const quotaCheck = await checkKeywordQuota(req.redis, req.user.id, req.user.tier);
    if (!quotaCheck.allowed) {
      return res.status(429).json({
        error: 'Daily keyword search quota exceeded',
        used: quotaCheck.used,
        limit: quotaCheck.limit,
        resetAt: new Date(Date.now() + 86400000).toISOString(),
      });
    }
    
    const result = await getKeywordSuggestions(q, { keywordCache: req.keywordCache });
    const limitedResults = {
      ...result,
      relatedKeywords: result.relatedKeywords.slice(0, parseInt(limit, 10)),
    };
    
    await incrementKeywordUsage(req.redis, req.user.id);
    
    res.json(limitedResults);
  } catch (err) {
    console.error('Keyword search error:', err.message);
    res.status(500).json({ error: 'Failed to search keywords' });
  }
});

router.get('/related', authMiddleware, async (req, res) => {
  try {
    const { q, limit = '10' } = req.query;
    
    if (!q || typeof q !== 'string') {
      return res.status(400).json({ error: 'Query parameter "q" required' });
    }
    
    const quotaCheck = await checkKeywordQuota(req.redis, req.user.id, req.user.tier);
    if (!quotaCheck.allowed) {
      return res.status(429).json({
        error: 'Daily keyword search quota exceeded',
        used: quotaCheck.used,
        limit: quotaCheck.limit,
      });
    }
    
    const baseResult = await searchKeyword(q, { keywordCache: req.keywordCache });
    const enriched = enrichKeywordResult(baseResult);
    
    await incrementKeywordUsage(req.redis, req.user.id);
    
    res.json({
      query: q,
      relatedKeywords: enriched.relatedKeywords.slice(0, parseInt(limit, 10)),
    });
  } catch (err) {
    console.error('Related keywords error:', err.message);
    res.status(500).json({ error: 'Failed to fetch related keywords' });
  }
});

router.post('/save', authMiddleware, async (req, res) => {
  try {
    const { keyword } = req.body;
    
    if (!keyword || typeof keyword !== 'string') {
      return res.status(400).json({ error: 'Keyword required' });
    }
    
    const userId = req.user.id;
    const savedKey = `user:${userId}:saved_keywords`;
    const saved = await req.redis.smembers(savedKey);
    
    if (saved.length >= 200) {
      return res.status(400).json({ error: 'Maximum 200 saved keywords reached' });
    }
    
    if (saved.includes(keyword)) {
      return res.status(409).json({ error: 'Keyword already saved' });
    }
    
    await req.redis.sadd(savedKey, keyword);
    
    res.json({ success: true, keyword });
  } catch (err) {
    console.error('Save keyword error:', err.message);
    res.status(500).json({ error: 'Failed to save keyword' });
  }
});

router.get('/saved', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const savedKey = `user:${userId}:saved_keywords`;
    const saved = await req.redis.smembers(savedKey);
    
    res.json({ keywords: saved });
  } catch (err) {
    console.error('Get saved keywords error:', err.message);
    res.status(500).json({ error: 'Failed to fetch saved keywords' });
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
    res.status(500).json({ error: 'Failed to delete keyword' });
  }
});

export default router;