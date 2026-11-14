import express from 'express';
import { getVideos, getVideoDetails, getChannels, normalizeVideo, normalizeChannel } from '../services/youtube.js';
import { calculateKanalisaScore, calculateOutlierRatio, estimateEarningsRupiah } from '../services/scoring.js';
import { authMiddleware, optionalAuthMiddleware } from '../middleware/auth.js';
import { checkKeywordQuota, incrementKeywordUsage } from '../middleware/rateLimit.js';

const router = express.Router();

router.get('/:id', optionalAuthMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { includeScore = 'true', includeChannel = 'true', includeEarnings = 'false' } = req.query;
    
    const video = await getVideoDetails(id);
    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }
    
    const normalized = normalizeVideo(video);
    
    let channelData = null;
    if (includeChannel === 'true') {
      const channel = await getChannels([normalized.channelId]);
      channelData = channel[0] ? normalizeChannel(channel[0]) : null;
    }
    
    let scoreData = null;
    if (includeScore === 'true') {
      const channelStats = channelData ? {
        avgViewsLast10: channelData.viewCount / Math.max(1, channelData.videoCount),
        medianVPH: 1000,
        categoryMedianEngagement: 0.02,
      } : {};
      
      scoreData = calculateKanalisaScore(normalized, channelStats);
      
      if (channelData) {
        scoreData.outlier = calculateOutlierRatio(normalized.viewCount, channelStats.avgViewsLast10);
      }
    }
    
    let earnings = null;
    if (includeEarnings === 'true' && req.user?.tier === 'pro') {
      earnings = estimateEarningsRupiah(normalized.viewCount);
    }
    
    res.json({
      video: normalized,
      channel: channelData,
      score: scoreData,
      earnings,
    });
  } catch (err) {
    console.error('Video route error:', err.message);
    res.status(500).json({ error: 'Failed to fetch video data' });
  }
});

router.post('/batch', optionalAuthMiddleware, async (req, res) => {
  try {
    const { ids } = req.body;
    
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'ids array required' });
    }
    
    if (ids.length > 50) {
      return res.status(400).json({ error: 'Maximum 50 videos per request' });
    }
    
    const videos = await getVideos(ids);
    const normalized = videos.map(normalizeVideo).filter(Boolean);
    
    res.json({ videos: normalized });
  } catch (err) {
    console.error('Video batch route error:', err.message);
    res.status(500).json({ error: 'Failed to fetch videos' });
  }
});

router.get('/channel/:channelId', optionalAuthMiddleware, async (req, res) => {
  try {
    const { channelId } = req.params;
    const { maxVideos = '10' } = req.query;
    
    const channel = await getChannels([channelId]);
    if (!channel[0]) {
      return res.status(404).json({ error: 'Channel not found' });
    }
    
    const normalizedChannel = normalizeChannel(channel[0]);
    
    res.json({ channel: normalizedChannel });
  } catch (err) {
    console.error('Channel route error:', err.message);
    res.status(500).json({ error: 'Failed to fetch channel data' });
  }
});

export default router;