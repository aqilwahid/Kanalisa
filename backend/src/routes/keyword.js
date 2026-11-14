import express from 'express';
import { searchKeywords, getRelatedKeywords, getSavedKeywords, saveKeyword, deleteSavedKeyword } from '../services/keyword-mock.js';
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
    
    const result = await searchKeywords(q);
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
    
    const relatedKeywords = await getRelatedKeywords(q);
    
    await incrementKeywordUsage(req.redis, req.user.id);
    
    res.json({
      query: q,
      relatedKeywords: relatedKeywords.slice(0, parseInt(limit, 10)),
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
    const result = await saveKeyword(userId, keyword);
    
    res.json(result);
  } catch (err) {
    console.error('Save keyword error:', err.message);
    res.status(500).json({ error: 'Failed to save keyword' });
  }
});

router.get('/saved', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const keywords = await getSavedKeywords(userId);
    
    res.json({ keywords });
  } catch (err) {
    console.error('Get saved keywords error:', err.message);
    res.status(500).json({ error: 'Failed to fetch saved keywords' });
  }
});

router.delete('/saved/:keyword', authMiddleware, async (req, res) => {
  try {
    const { keyword } = req.params;
    const userId = req.user.id;
    
    await deleteSavedKeyword(userId, keyword);
    
    res.json({ success: true });
  } catch (err) {
    console.error('Delete saved keyword error:', err.message);
    res.status(500).json({ error: 'Failed to delete keyword' });
  }
});

export default router;