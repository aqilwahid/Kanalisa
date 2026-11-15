import { google } from 'googleapis';
import { config, modes } from '../config.js';
import {
  getVideoStats as getMockVideoStats,
  getChannelStats as getMockChannelStats,
  getVideosBatch as getMockVideosBatch,
  getChannelsBatch as getMockChannelsBatch,
  searchVideosMock,
} from './youtube-mock.js';

const youtube = google.youtube('v3');

const QUOTA_COST = {
  'videos.list': 1,
  'channels.list': 1,
  'search.list': 100,
};

let quotaUsed = 0;
const QUOTA_DAILY_LIMIT = 10000;
const QUOTA_ALERT_THRESHOLD = 0.8;

export const isMockMode = modes.youtube === 'mock';

async function executeCall(apiCall, mockCall, method) {
  if (isMockMode) {
    return mockCall();
  }

  // Dalam live mode: jangan silent-fallback ke mock saat API gagal.
  try {
    const result = await apiCall();
    trackQuota(method);
    return result;
  } catch (err) {
    console.error(`[YouTube API Error] ${method}:`, err.message);
    throw new Error(`YouTube API ${method} failed: ${err.message}`);
  }
}

export async function getVideos(videoIds, parts = ['snippet', 'statistics', 'contentDetails']) {
  if (!Array.isArray(videoIds) || !videoIds.length) return [];

  const results = [];
  const batchSize = 50;

  for (let i = 0; i < videoIds.length; i += batchSize) {
    const batch = videoIds.slice(i, i + batchSize);

    const batchResults = await executeCall(
      async () => {
        const response = await youtube.videos.list({
          key: config.YOUTUBE_API_KEY,
          part: parts.join(','),
          id: batch.join(','),
        });
        return response.data.items || [];
      },
      async () => getMockVideosBatch(batch),
      'videos.list'
    );

    results.push(...batchResults);
  }

  return results;
}

export async function getChannels(channelIds, parts = ['snippet', 'statistics']) {
  if (!Array.isArray(channelIds) || !channelIds.length) return [];

  const results = [];
  const batchSize = 50;

  for (let i = 0; i < channelIds.length; i += batchSize) {
    const batch = channelIds.slice(i, i + batchSize);

    const batchResults = await executeCall(
      async () => {
        const response = await youtube.channels.list({
          key: config.YOUTUBE_API_KEY,
          part: parts.join(','),
          id: batch.join(','),
        });
        return response.data.items || [];
      },
      async () => getMockChannelsBatch(batch),
      'channels.list'
    );

    results.push(...batchResults);
  }

  return results;
}

export async function searchVideos(query, options = {}) {
  const {
    maxResults = 20,
    order = 'relevance',
    type = 'video',
    regionCode = 'ID',
    relevanceLanguage = 'id',
  } = options;

  return executeCall(
    async () => {
      const response = await youtube.search.list({
        key: config.YOUTUBE_API_KEY,
        part: ['snippet'],
        q: query,
        maxResults,
        order,
        type,
        regionCode,
        relevanceLanguage,
      });
      return response.data.items || [];
    },
    async () => searchVideosMock(query, { maxResults }),
    'search.list'
  );
}

export async function getVideoDetails(videoId) {
  if (!videoId || typeof videoId !== 'string') return null;

  return executeCall(
    async () => {
      const videos = await getVideos([videoId]);
      return videos[0] || null;
    },
    async () => {
      try {
        return await getMockVideoStats(videoId);
      } catch {
        return null;
      }
    },
    'videos.list'
  );
}

export async function getChannelDetails(channelId) {
  if (!channelId || typeof channelId !== 'string') return null;

  return executeCall(
    async () => {
      const channels = await getChannels([channelId]);
      return channels[0] || null;
    },
    async () => {
      try {
        return await getMockChannelStats(channelId);
      } catch {
        return null;
      }
    },
    'channels.list'
  );
}

function trackQuota(method) {
  const cost = QUOTA_COST[method] || 0;
  quotaUsed += cost;

  if (quotaUsed > QUOTA_DAILY_LIMIT * QUOTA_ALERT_THRESHOLD) {
    console.warn(`⚠️ YouTube API quota usage: ${quotaUsed}/${QUOTA_DAILY_LIMIT} (${Math.round((quotaUsed / QUOTA_DAILY_LIMIT) * 100)}%)`);
  }
}

export function getQuotaUsage() {
  return {
    used: quotaUsed,
    limit: QUOTA_DAILY_LIMIT,
    remaining: Math.max(0, QUOTA_DAILY_LIMIT - quotaUsed),
    percentage: Math.round((quotaUsed / QUOTA_DAILY_LIMIT) * 100),
  };
}

export function resetQuotaCounter() {
  quotaUsed = 0;
}

/**
 * Normalisasi objek video baik dari response API YouTube v3 maupun mock video.
 */
export function normalizeVideo(video) {
  if (!video) return null;

  const stats = video.statistics || {};
  const snippet = video.snippet || {};
  const contentDetails = video.contentDetails || {};

  return {
    id: video.id,
    title: snippet.title ?? video.title ?? '',
    description: snippet.description ?? video.description ?? '',
    publishedAt: snippet.publishedAt ?? video.publishedAt ?? new Date().toISOString(),
    channelId: snippet.channelId ?? video.channelId ?? '',
    channelTitle: snippet.channelTitle ?? video.channelTitle ?? '',
    tags: snippet.tags ?? video.tags ?? [],
    thumbnails: snippet.thumbnails ?? video.thumbnails ?? {},
    duration: contentDetails.duration ?? video.duration ?? 'PT0S',
    viewCount: parseInt(stats.viewCount ?? video.viewCount ?? 0, 10) || 0,
    likeCount: parseInt(stats.likeCount ?? video.likeCount ?? 0, 10) || 0,
    commentCount: parseInt(stats.commentCount ?? video.commentCount ?? 0, 10) || 0,
  };
}

/**
 * Normalisasi objek channel baik dari response API YouTube v3 maupun mock channel.
 */
export function normalizeChannel(channel) {
  if (!channel) return null;

  const stats = channel.statistics || {};
  const snippet = channel.snippet || {};

  return {
    id: channel.id,
    title: snippet.title ?? channel.title ?? '',
    description: snippet.description ?? channel.description ?? '',
    publishedAt: snippet.publishedAt ?? channel.publishedAt ?? new Date().toISOString(),
    thumbnails: snippet.thumbnails ?? channel.thumbnails ?? {},
    subscriberCount: parseInt(stats.subscriberCount ?? channel.subscriberCount ?? 0, 10) || 0,
    videoCount: parseInt(stats.videoCount ?? channel.videoCount ?? 0, 10) || 0,
    viewCount: parseInt(stats.viewCount ?? channel.viewCount ?? 0, 10) || 0,
  };
}
