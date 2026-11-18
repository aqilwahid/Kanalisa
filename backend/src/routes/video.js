import express from 'express';
import { modes } from '../config.js';
import { getVideoDetails, getChannelDetails, getVideos, normalizeVideo, normalizeChannel } from '../services/youtube.js';
import { calculateKanalisaScore, calculateOutlierRatio, calculateVideoVelocity, estimateEarningsRupiah } from '../services/scoring.js';
import { optionalAuthMiddleware } from '../middleware/auth.js';

const router = express.Router();

const VIDEO_ID_REGEX = /^[a-zA-Z0-9_-]{6,20}$/;

router.get('/:id', optionalAuthMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { includeScore = 'true', includeChannel = 'true', includeEarnings = 'false' } = req.query;

    if (!VIDEO_ID_REGEX.test(id)) {
      return res.status(400).json({ error: 'Format video ID tidak valid' });
    }

    const video = await getVideoDetails(id);
    if (!video) {
      return res.status(404).json({ error: 'Video tidak ditemukan' });
    }

    const normalized = normalizeVideo(video);

    let channelData = null;
    if (includeChannel === 'true' && normalized.channelId) {
      const channel = await getChannelDetails(normalized.channelId);
      channelData = channel ? normalizeChannel(channel) : null;
    }

    let scoreData = null;
    if (includeScore === 'true') {
      const channelStats = channelData
        ? {
            avgViewsLast10: channelData.viewCount / Math.max(1, channelData.videoCount),
            medianVPH: 1000,
            categoryMedianEngagement: 0.02,
          }
        : {
            medianVPH: 1000,
            categoryMedianEngagement: 0.02,
          };

      scoreData = calculateKanalisaScore(normalized, channelStats);

      if (channelData && channelStats.avgViewsLast10 > 0) {
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
      isMock: modes.youtube === 'mock',
      source: modes.youtube === 'mock' ? 'mock' : 'youtube-v3',
    });
  } catch (err) {
    console.error('Video route error:', err.message);
    res.status(500).json({ error: 'Gagal memuat data video: ' + err.message });
  }
});

router.post('/batch', optionalAuthMiddleware, async (req, res) => {
  try {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'Array "ids" wajib disertakan' });
    }

    if (ids.length > 50) {
      return res.status(400).json({ error: 'Maksimal 50 video per permintaan' });
    }

    const validIds = ids.filter((id) => typeof id === 'string' && VIDEO_ID_REGEX.test(id));
    if (!validIds.length) {
      return res.status(400).json({ error: 'Tidak ada video ID valid yang diberikan' });
    }

    const metricsOnly = req.query.metrics === 'true';
    const videos = await getVideos(validIds, metricsOnly ? ['snippet', 'statistics'] : undefined);
    const normalized = videos.map(normalizeVideo).filter(Boolean);

    res.json({
      videos: metricsOnly ? normalized.map(({ id, viewCount, publishedAt }) => ({
        id,
        vph: Math.round(calculateVideoVelocity(viewCount, publishedAt).vph),
      })) : normalized,
      isMock: modes.youtube === 'mock',
      source: modes.youtube === 'mock' ? 'mock' : 'youtube-v3',
    });
  } catch (err) {
    console.error('Video batch route error:', err.message);
    res.status(500).json({ error: 'Gagal memuat daftar video' });
  }
});

router.get('/channel/:channelId', optionalAuthMiddleware, async (req, res) => {
  try {
    const { channelId } = req.params;

    const channel = await getChannelDetails(channelId);
    if (!channel) {
      return res.status(404).json({ error: 'Kanal tidak ditemukan' });
    }

    const normalizedChannel = normalizeChannel(channel);

    res.json({
      channel: normalizedChannel,
      isMock: modes.youtube === 'mock',
      source: modes.youtube === 'mock' ? 'mock' : 'youtube-v3',
    });
  } catch (err) {
    console.error('Channel route error:', err.message);
    res.status(500).json({ error: 'Gagal memuat data kanal' });
  }
});

export default router;
