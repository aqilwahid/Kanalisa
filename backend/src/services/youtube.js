import { google } from 'googleapis';
import { config } from '../config.js';

const youtube = google.youtube('v3');

const QUOTA_COST = {
  'videos.list': 1,
  'channels.list': 1,
  'search.list': 100,
};

let quotaUsed = 0;
const QUOTA_DAILY_LIMIT = 10000;
const QUOTA_ALERT_THRESHOLD = 0.8;

export async function getVideos(videoIds, parts = ['snippet', 'statistics', 'contentDetails']) {
  if (!videoIds.length) return [];
  
  const results = [];
  const batchSize = 50;
  
  for (let i = 0; i < videoIds.length; i += batchSize) {
    const batch = videoIds.slice(i, i + batchSize);
    
    try {
      const response = await youtube.videos.list({
        key: config.YOUTUBE_API_KEY,
        part: parts.join(','),
        id: batch.join(','),
      });
      
      trackQuota('videos.list');
      results.push(...(response.data.items || []));
    } catch (err) {
      console.error('YouTube API videos.list error:', err.message);
      throw new Error(`Failed to fetch videos: ${err.message}`);
    }
  }
  
  return results;
}

export async function getChannels(channelIds, parts = ['snippet', 'statistics']) {
  if (!channelIds.length) return [];
  
  const results = [];
  const batchSize = 50;
  
  for (let i = 0; i < channelIds.length; i += batchSize) {
    const batch = channelIds.slice(i, i + batchSize);
    
    try {
      const response = await youtube.channels.list({
        key: config.YOUTUBE_API_KEY,
        part: parts.join(','),
        id: batch.join(','),
      });
      
      trackQuota('channels.list');
      results.push(...(response.data.items || []));
    } catch (err) {
      console.error('YouTube API channels.list error:', err.message);
      throw new Error(`Failed to fetch channels: ${err.message}`);
    }
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
  
  try {
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
    
    trackQuota('search.list');
    return response.data.items || [];
  } catch (err) {
    console.error('YouTube API search.list error:', err.message);
    throw new Error(`Failed to search videos: ${err.message}`);
  }
}

export async function getVideoDetails(videoId) {
  const videos = await getVideos([videoId]);
  return videos[0] || null;
}

export async function getChannelDetails(channelId) {
  const channels = await getChannels([channelId]);
  return channels[0] || null;
}

function trackQuota(method) {
  const cost = QUOTA_COST[method] || 0;
  quotaUsed += cost;
  
  if (quotaUsed > QUOTA_DAILY_LIMIT * QUOTA_ALERT_THRESHOLD) {
    console.warn(`⚠️ YouTube API quota usage: ${quotaUsed}/${QUOTA_DAILY_LIMIT} (${Math.round(quotaUsed/QUOTA_DAILY_LIMIT*100)}%)`);
  }
}

export function getQuotaUsage() {
  return {
    used: quotaUsed,
    limit: QUOTA_DAILY_LIMIT,
    remaining: Math.max(0, QUOTA_DAILY_LIMIT - quotaUsed),
    percentage: Math.round(quotaUsed / QUOTA_DAILY_LIMIT * 100),
  };
}

export function resetQuotaCounter() {
  quotaUsed = 0;
}

export function normalizeVideo(video) {
  if (!video) return null;
  
  const stats = video.statistics || {};
  const snippet = video.snippet || {};
  const contentDetails = video.contentDetails || {};
  
  return {
    id: video.id,
    title: snippet.title,
    description: snippet.description,
    publishedAt: snippet.publishedAt,
    channelId: snippet.channelId,
    channelTitle: snippet.channelTitle,
    tags: snippet.tags || [],
    thumbnails: snippet.thumbnails,
    duration: contentDetails.duration,
    viewCount: parseInt(stats.viewCount || '0', 10),
    likeCount: parseInt(stats.likeCount || '0', 10),
    commentCount: parseInt(stats.commentCount || '0', 10),
  };
}

export function normalizeChannel(channel) {
  if (!channel) return null;
  
  const stats = channel.statistics || {};
  const snippet = channel.snippet || {};
  
  return {
    id: channel.id,
    title: snippet.title,
    description: snippet.description,
    publishedAt: snippet.publishedAt,
    thumbnails: snippet.thumbnails,
    subscriberCount: parseInt(stats.subscriberCount || '0', 10),
    videoCount: parseInt(stats.videoCount || '0', 10),
    viewCount: parseInt(stats.viewCount || '0', 10),
  };
}