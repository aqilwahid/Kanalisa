import express from 'express';
import { getVideoStats, getChannelStats, getVideosBatch, getChannelsBatch } from '../services/youtube-mock.js';
import { calculateKanalisaScore, calculateOutlierRatio, estimateEarningsRupiah } from '../services/scoring.js';
import { optionalAuthMiddleware } from '../middleware/auth.js';

const router = express.Router();

function normalizeVideoMock(video) {
  return {
    id: video.id,
    title: video.title,
    description: video.description,
    publishedAt: video.publishedAt,
    channelId: video.channelId,
    channelTitle: video.channelTitle,
    tags: video.tags || [],
    thumbnails: video.thumbnails,
    duration: video.duration,
    viewCount: video.viewCount,
    likeCount: video.likeCount,
    commentCount: video.commentCount,
  };
}

function normalizeChannelMock(channel) {
  return {
    id: channel.id,
    title: channel.title,
    description: channel.description,
    publishedAt: channel.publishedAt,
    thumbnails: channel.thumbnails,
    subscriberCount: channel.subscriberCount,
    videoCount: channel.videoCount,
    viewCount: channel.viewCount,
  };
}

router.get('/:id', optionalAuthMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { includeScore = 'true', includeChannel = 'true', includeEarnings = 'false' } = req.query;
    
    const video = await getVideoStats(id);
    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }
    
    const normalized = normalizeVideoMock(video);
    
    let channelData = null;
    if (includeChannel === 'true') {
      const channel = await getChannelStats(normalized.channelId);
      channelData = channel ? normalizeChannelMock(channel) : null;
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
    
    const videos = await getVideosBatch(ids);
    const normalized = videos.map(normalizeVideoMock).filter(Boolean);
    
    res.json({ videos: normalized });
  } catch (err) {
    console.error('Video batch route error:', err.message);
    res.status(500).json({ error: 'Failed to fetch videos' });
  }
});

router.get('/channel/:channelId', optionalAuthMiddleware, async (req, res) => {
  try {
    const { channelId } = req.params;
    
    const channel = await getChannelStats(channelId);
    if (!channel) {
      return res.status(404).json({ error: 'Channel not found' });
    }
    
    const normalizedChannel = normalizeChannelMock(channel);
    
    res.json({ channel: normalizedChannel });
  } catch (err) {
    console.error('Channel route error:', err.message);
    res.status(500).json({ error: 'Failed to fetch channel data' });
  }
});

export default router;