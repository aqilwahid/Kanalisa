const QUOTA_COST = {
  'videos.list': 1,
  'channels.list': 1,
  'search.list': 100,
  'commentThreads.list': 1,
  'playlistItems.list': 1,
};

const DAILY_LIMIT = 10000;
const ALERT_THRESHOLD = 0.8;
const CRITICAL_THRESHOLD = 0.95;

let dailyUsage = 0;
let lastResetDate = new Date().toDateString();

export function trackQuota(method, count = 1) {
  const cost = QUOTA_COST[method] || 0;
  dailyUsage += cost * count;
  checkThresholds();
  return dailyUsage;
}

export function getQuotaUsage() {
  checkDateReset();
  return {
    used: dailyUsage,
    limit: DAILY_LIMIT,
    remaining: Math.max(0, DAILY_LIMIT - dailyUsage),
    percentage: Math.round((dailyUsage / DAILY_LIMIT) * 100),
  };
}

export function canAfford(method, count = 1) {
  checkDateReset();
  const cost = QUOTA_COST[method] || 0;
  return dailyUsage + cost * count <= DAILY_LIMIT;
}

export function getRemainingForMethod(method) {
  checkDateReset();
  const cost = QUOTA_COST[method] || 0;
  if (cost === 0) return Infinity;
  return Math.floor((DAILY_LIMIT - dailyUsage) / cost);
}

function checkDateReset() {
  const today = new Date().toDateString();
  if (today !== lastResetDate) {
    dailyUsage = 0;
    lastResetDate = today;
  }
}

function checkThresholds() {
  const percentage = dailyUsage / DAILY_LIMIT;
  
  if (percentage >= CRITICAL_THRESHOLD) {
    console.error(`🚨 CRITICAL: YouTube API quota at ${Math.round(percentage * 100)}% (${dailyUsage}/${DAILY_LIMIT})`);
  } else if (percentage >= ALERT_THRESHOLD) {
    console.warn(`⚠️ WARNING: YouTube API quota at ${Math.round(percentage * 100)}% (${dailyUsage}/${DAILY_LIMIT})`);
  }
}

export function resetQuota() {
  dailyUsage = 0;
  lastResetDate = new Date().toDateString();
}

export function getQuotaCost(method) {
  return QUOTA_COST[method] || 0;
}

export function estimateBatchCost(videoCount, includeChannels = false) {
  const videoBatches = Math.ceil(videoCount / 50);
  let cost = videoBatches * QUOTA_COST['videos.list'];
  
  if (includeChannels) {
    const channelBatches = Math.ceil(videoCount / 50);
    cost += channelBatches * QUOTA_COST['channels.list'];
  }
  
  return cost;
}