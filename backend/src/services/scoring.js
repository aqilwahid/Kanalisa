export function calculateKanalisaScore(video, channelStats = {}) {
  const {
    viewCount = 0,
    likeCount = 0,
    commentCount = 0,
    publishedAt,
    tags = [],
    title = '',
    description = '',
  } = video;

  const {
    avgViewsLast10 = 1,
    medianVPH = 1,
    categoryMedianEngagement = 0.02,
  } = channelStats;

  const hoursSincePublish = publishedAt
    ? (Date.now() - new Date(publishedAt).getTime()) / (1000 * 60 * 60)
    : 1;

  const vph = hoursSincePublish > 0 ? viewCount / hoursSincePublish : 0;
  
  const speedScore = calculateSpeedScore(vph, medianVPH);
  const engagementScore = calculateEngagementScore(likeCount, commentCount, viewCount, categoryMedianEngagement);
    const seoScoreResult = calculateSEOScore(title, description, tags);
  const keywordRelevanceScore = calculateKeywordRelevance(title, description, tags);

  const weights = {
    speed: 0.35,
    engagement: 0.25,
    seo: 0.20,
    keyword: 0.20,
  };

  const totalScore = Math.round(
    speedScore * weights.speed +
    engagementScore * weights.engagement +
      seoScoreResult.score * weights.seo +
    keywordRelevanceScore * weights.keyword
  );

  return {
    total: Math.min(100, Math.max(0, totalScore)),
    breakdown: {
      speed: { score: speedScore, weight: weights.speed, label: 'Kecepatan (TPJ relatif)' },
      engagement: { score: engagementScore, weight: weights.engagement, label: 'Interaksi' },
        seo: { score: seoScoreResult.score, weight: weights.seo, label: 'Kekuatan SEO metadata', checks: seoScoreResult.checks },
      keyword: { score: keywordRelevanceScore, weight: weights.keyword, label: 'Relevansi kata kunci' },
    },
    meta: {
      vph: Math.round(vph),
      engagementRate: viewCount > 0 ? (likeCount + commentCount) / viewCount : 0,
      titleLength: title.length,
      descriptionLength: description.length,
      tagCount: tags.length,
    },
  };
}

export function calculateSpeedScore(vph, medianVPH) {
  if (medianVPH <= 0) return 50;
  const ratio = vph / medianVPH;
  const logRatio = Math.log10(Math.max(0.1, ratio));
  const normalized = (logRatio + 1) / 2 * 100;
  return Math.min(100, Math.max(0, Math.round(normalized)));
}

export function calculateEngagementScore(likes, comments, views, categoryMedian) {
  if (views <= 0) return 0;
  const rate = (likes + comments) / views;
  if (categoryMedian <= 0) return Math.min(100, Math.round(rate * 5000));
  const ratio = rate / categoryMedian;
  const logRatio = Math.log10(Math.max(0.1, ratio));
  const normalized = (logRatio + 1) / 2 * 100;
  return Math.min(100, Math.max(0, Math.round(normalized)));
}

export function calculateSEOScore(title, description, tags) {
  let score = 0;
  const checks = [];

  if (title.length >= 40 && title.length <= 100) {
    score += 20;
    checks.push({ check: 'Panjang judul optimal (40-100 char)', passed: true });
  } else {
    checks.push({ check: 'Panjang judul optimal (40-100 char)', passed: false });
  }

  if (description.length >= 150) {
    score += 15;
    checks.push({ check: 'Deskripsi minimal 150 char', passed: true });
  } else {
    checks.push({ check: 'Deskripsi minimal 150 char', passed: false });
  }

  if (tags.length >= 5 && tags.length <= 15) {
    score += 15;
    checks.push({ check: 'Tag 5-15 buah', passed: true });
  } else {
    checks.push({ check: 'Tag 5-15 buah', passed: false });
  }

  const hasLinks = /https?:\/\//.test(description);
  if (hasLinks) {
    score += 10;
    checks.push({ check: 'Memiliki link (sosmed/referensi)', passed: true });
  } else {
    checks.push({ check: 'Memiliki link (sosmed/referensi)', passed: false });
  }

  const hasTimestamps = /\d{1,2}:\d{2}/.test(description);
  if (hasTimestamps) {
    score += 10;
    checks.push({ check: 'Memiliki timestamp', passed: true });
  } else {
    checks.push({ check: 'Memiliki timestamp', passed: false });
  }

  const hasHashtags = /#\w+/.test(description);
  if (hasHashtags) {
    score += 10;
    checks.push({ check: 'Memiliki hashtag', passed: true });
  } else {
    checks.push({ check: 'Memiliki hashtag', passed: false });
  }

  const keywordInTitle = extractMainKeyword(title);
  const keywordInDesc = description.toLowerCase().includes(keywordInTitle.toLowerCase());
  const keywordInTags = tags.some(t => t.toLowerCase().includes(keywordInTitle.toLowerCase()));
  
  if (keywordInDesc && keywordInTags) {
    score += 20;
    checks.push({ check: 'Kata kunci utama di judul, deskripsi, & tag', passed: true });
  } else if (keywordInDesc || keywordInTags) {
    score += 10;
    checks.push({ check: 'Kata kunci utama di judul, deskripsi, & tag', passed: 'partial' });
  } else {
    checks.push({ check: 'Kata kunci utama di judul, deskripsi, & tag', passed: false });
  }

  return { score: Math.min(100, score), checks };
}

export function calculateKeywordRelevance(title, description, tags) {
  const titleTokens = tokenize(title);
  const descTokens = tokenize(description);
  const tagTokens = tags.flatMap(t => tokenize(t));
  
  if (titleTokens.length === 0) return 0;
  
  const titleSet = new Set(titleTokens);
  const descSet = new Set(descTokens);
  const tagSet = new Set(tagTokens);
  
  let matches = 0;
  for (const token of titleSet) {
    if (descSet.has(token)) matches++;
    if (tagSet.has(token)) matches++;
  }
  
  const maxPossible = titleSet.size * 2;
  if (maxPossible === 0) return 0;
  
  return Math.round((matches / maxPossible) * 100);
}

function extractMainKeyword(title) {
  const tokens = tokenize(title);
  const freq = {};
  for (const token of tokens) {
    freq[token] = (freq[token] || 0) + 1;
  }
  return Object.entries(freq).sort((a, b) => b[1] - a[1])[0]?.[0] || '';
}

function tokenize(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length > 2);
}

export function calculateOutlierRatio(videoViews, channelAvgViews) {
  if (channelAvgViews <= 0) return null;
  const ratio = videoViews / channelAvgViews;
  return ratio > 1.5 ? Math.round(ratio * 10) / 10 : null;
}

export function estimateEarningsRupiah(viewCount, category = 'general') {
  const rpmRanges = {
    gaming: { min: 15000, max: 40000 },
    tech: { min: 25000, max: 60000 },
    education: { min: 20000, max: 50000 },
    entertainment: { min: 10000, max: 30000 },
    lifestyle: { min: 15000, max: 40000 },
    general: { min: 12000, max: 35000 },
  };
  
  const range = rpmRanges[category] || rpmRanges.general;
  const min = Math.round((viewCount / 1000) * range.min);
  const max = Math.round((viewCount / 1000) * range.max);
  
  return { min, max, currency: 'IDR', label: 'Estimasi kasar' };
}