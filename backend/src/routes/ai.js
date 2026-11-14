import express from 'express';
import { 
  suggestTitles, 
  suggestDescription, 
  suggestTags, 
  suggestVideoIdeas, 
  answerQuestion,
  getCreditCost 
} from '../services/ai.js';
import { authMiddleware } from '../middleware/auth.js';
import { checkAICredits, incrementAIUsage } from '../middleware/rateLimit.js';

const router = express.Router();

router.post('/suggest-title', authMiddleware, async (req, res) => {
  try {
    const { topic, niche, style = 'santai', count = 5 } = req.body;
    
    if (!topic || !niche) {
      return res.status(400).json({ error: 'topic and niche required' });
    }
    
    const creditsNeeded = getCreditCost('suggest-title');
    const creditCheck = await checkAICredits(req.redis, req.user.id, req.user.tier, creditsNeeded);
    
    if (!creditCheck.allowed) {
      return res.status(429).json({
        error: 'Monthly AI credits exhausted',
        used: creditCheck.used,
        limit: creditCheck.limit,
        resetAt: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toISOString(),
      });
    }
    
    const titles = await suggestTitles({ topic, niche, style, count });
    
    await incrementAIUsage(req.redis, req.user.id, creditsNeeded);
    
    res.json({ titles, creditsUsed: creditsNeeded });
  } catch (err) {
    console.error('Suggest title error:', err.message);
    res.status(500).json({ error: 'Failed to generate titles' });
  }
});

router.post('/suggest-description', authMiddleware, async (req, res) => {
  try {
    const { title, topic, niche, style = 'santai', includeTimestamps = true, includeHashtags = true, includeLinks = true } = req.body;
    
    if (!title || !topic || !niche) {
      return res.status(400).json({ error: 'title, topic, and niche required' });
    }
    
    const creditsNeeded = getCreditCost('suggest-description');
    const creditCheck = await checkAICredits(req.redis, req.user.id, req.user.tier, creditsNeeded);
    
    if (!creditCheck.allowed) {
      return res.status(429).json({
        error: 'Monthly AI credits exhausted',
        used: creditCheck.used,
        limit: creditCheck.limit,
      });
    }
    
    const result = await suggestDescription({ title, topic, niche, style, includeTimestamps, includeHashtags, includeLinks });
    
    await incrementAIUsage(req.redis, req.user.id, creditsNeeded);
    
    res.json({ ...result, creditsUsed: creditsNeeded });
  } catch (err) {
    console.error('Suggest description error:', err.message);
    res.status(500).json({ error: 'Failed to generate description' });
  }
});

router.post('/suggest-tags', authMiddleware, async (req, res) => {
  try {
    const { title, description, topic, niche, maxTags = 15 } = req.body;
    
    if (!title || !topic || !niche) {
      return res.status(400).json({ error: 'title, topic, and niche required' });
    }
    
    const creditsNeeded = getCreditCost('suggest-tags');
    const creditCheck = await checkAICredits(req.redis, req.user.id, req.user.tier, creditsNeeded);
    
    if (!creditCheck.allowed) {
      return res.status(429).json({
        error: 'Monthly AI credits exhausted',
        used: creditCheck.used,
        limit: creditCheck.limit,
      });
    }
    
    const result = await suggestTags({ title, description, topic, niche, maxTags });
    
    await incrementAIUsage(req.redis, req.user.id, creditsNeeded);
    
    res.json({ ...result, creditsUsed: creditsNeeded });
  } catch (err) {
    console.error('Suggest tags error:', err.message);
    res.status(500).json({ error: 'Failed to generate tags' });
  }
});

router.post('/suggest-ideas', authMiddleware, async (req, res) => {
  try {
    const { niche, channelData, count = 5 } = req.body;
    
    if (!niche) {
      return res.status(400).json({ error: 'niche required' });
    }
    
    const creditsNeeded = getCreditCost('suggest-ideas');
    const creditCheck = await checkAICredits(req.redis, req.user.id, req.user.tier, creditsNeeded);
    
    if (!creditCheck.allowed) {
      return res.status(429).json({
        error: 'Monthly AI credits exhausted',
        used: creditCheck.used,
        limit: creditCheck.limit,
      });
    }
    
    const result = await suggestVideoIdeas({ niche, channelData, count });
    
    await incrementAIUsage(req.redis, req.user.id, creditsNeeded);
    
    res.json({ ...result, creditsUsed: creditsNeeded });
  } catch (err) {
    console.error('Suggest ideas error:', err.message);
    res.status(500).json({ error: 'Failed to generate video ideas' });
  }
});

router.post('/answer', authMiddleware, async (req, res) => {
  try {
    const { question, channelData, videoData } = req.body;
    
    if (!question) {
      return res.status(400).json({ error: 'question required' });
    }
    
    const creditsNeeded = getCreditCost('answer-question');
    const creditCheck = await checkAICredits(req.redis, req.user.id, req.user.tier, creditsNeeded);
    
    if (!creditCheck.allowed) {
      return res.status(429).json({
        error: 'Monthly AI credits exhausted',
        used: creditCheck.used,
        limit: creditCheck.limit,
      });
    }
    
    const result = await answerQuestion({ question, channelData, videoData });
    
    await incrementAIUsage(req.redis, req.user.id, creditsNeeded);
    
    res.json({ ...result, creditsUsed: creditsNeeded });
  } catch (err) {
    console.error('Answer question error:', err.message);
    res.status(500).json({ error: 'Failed to answer question' });
  }
});

router.get('/credits', authMiddleware, async (req, res) => {
  try {
    const monthKey = `ratelimit:ai:${req.user.id}:${new Date().toISOString().slice(0, 7)}`;
    const used = await req.redis.get(monthKey).then(Number).catch(() => 0);
    
    const TIER_LIMITS = {
      free: 50,
      pro: 1500,
      agency: 6000,
    };
    
    const limit = TIER_LIMITS[req.user.tier] || TIER_LIMITS.free;
    
    res.json({
      used,
      limit,
      remaining: Math.max(0, limit - used),
      tier: req.user.tier,
    });
  } catch (err) {
    console.error('Get credits error:', err.message);
    res.status(500).json({ error: 'Failed to fetch credits' });
  }
});

export default router;