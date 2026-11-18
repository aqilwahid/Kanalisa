// Layanan perhitungan Skor Kanalisa, TPJ, checklist SEO, dan peluang kata kunci
// Berdasarkan spesifikasi PRD §7 dan Glosarium §17

export const WEIGHTS = Object.freeze({
  speed: 0.35,
  engagement: 0.25,
  seo: 0.20,
  keyword: 0.20,
});

export function calculateVideoVelocity(viewCount, publishedAt) {
  const now = Date.now();
  const publishedTimestamp = publishedAt ? new Date(publishedAt).getTime() : now;
  const hoursSincePublish = Math.max(180000, now - publishedTimestamp) / 3600000;
  return { vph: viewCount > 0 ? viewCount / hoursSincePublish : 0, hoursSincePublish };
}

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
    avgViewsLast10 = 0,
    medianVPH = 1000,
    categoryMedianEngagement = 0.02,
  } = channelStats;

  const { vph, hoursSincePublish } = calculateVideoVelocity(viewCount, publishedAt);

  const speedScore = calculateSpeedScore(vph, medianVPH);
  const engagementScore = calculateEngagementScore(likeCount, commentCount, viewCount, categoryMedianEngagement);
  const seoScoreResult = calculateSEOScore(title, description, tags);
  const keywordRelevanceScore = calculateKeywordRelevance(title, description, tags);

  const totalScore = Math.round(
    speedScore * WEIGHTS.speed +
    engagementScore * WEIGHTS.engagement +
    seoScoreResult.score * WEIGHTS.seo +
    keywordRelevanceScore * WEIGHTS.keyword
  );

  const clampedTotal = Math.min(100, Math.max(0, totalScore));

  return {
    total: clampedTotal,
    breakdown: {
      speed: {
        score: speedScore,
        weight: WEIGHTS.speed,
        label: 'Kecepatan (TPJ relatif)',
        method: 'Rata-rata tayangan per jam sejak publikasi dibanding median kanal (bukan real-time)',
      },
      engagement: {
        score: engagementScore,
        weight: WEIGHTS.engagement,
        label: 'Tingkat interaksi',
        method: '(Suka + Komentar) / Tayangan dibanding median kategori',
      },
      seo: {
        score: seoScoreResult.score,
        weight: WEIGHTS.seo,
        label: 'Kekuatan SEO metadata',
        checks: seoScoreResult.checks,
      },
      keyword: {
        score: keywordRelevanceScore,
        weight: WEIGHTS.keyword,
        label: 'Relevansi kata kunci',
        method: 'Kecocokan token judul terhadap deskripsi dan tag',
      },
    },
    checks: seoScoreResult.checks,
    meta: {
      vph: Math.round(vph),
      vphMethod: 'average_since_publish',
      vphLabel: 'Tayangan per Jam (Rata-rata sejak publikasi)',
      hoursSincePublish: Math.round(hoursSincePublish * 10) / 10,
      engagementRate: viewCount > 0 ? (likeCount + commentCount) / viewCount : 0,
      titleLength: title.length,
      descriptionLength: description.length,
      tagCount: tags.length,
      benchmarkMedianVPH: medianVPH,
      benchmarkCategoryEngagement: categoryMedianEngagement,
    },
  };
}

export function calculateSpeedScore(vph, medianVPH) {
  if (medianVPH <= 0 || vph <= 0) return vph > 0 ? 50 : 0;
  const ratio = vph / medianVPH;
  const logRatio = Math.log10(Math.max(0.1, ratio));
  const normalized = ((logRatio + 1) / 2) * 100;
  return Math.min(100, Math.max(0, Math.round(normalized)));
}

export function calculateEngagementScore(likes, comments, views, categoryMedian) {
  if (views <= 0) return 0;
  const rate = (likes + comments) / views;
  if (categoryMedian <= 0) return Math.min(100, Math.round(rate * 5000));
  const ratio = rate / categoryMedian;
  const logRatio = Math.log10(Math.max(0.1, ratio));
  const normalized = ((logRatio + 1) / 2) * 100;
  return Math.min(100, Math.max(0, Math.round(normalized)));
}

export function calculateSEOScore(title = '', description = '', tags = []) {
  let score = 0;
  const checks = [];

  const titleLengthValid = title.length >= 40 && title.length <= 100;
  if (titleLengthValid) score += 20;
  checks.push({
    id: 'titleLength',
    check: 'Panjang judul optimal (40-100 char)',
    passed: titleLengthValid,
    points: 20,
  });

  const descLengthValid = description.length >= 150;
  if (descLengthValid) score += 15;
  checks.push({
    id: 'descriptionLength',
    check: 'Deskripsi minimal 150 char',
    passed: descLengthValid,
    points: 15,
  });

  const tagCountValid = tags.length >= 5 && tags.length <= 15;
  if (tagCountValid) score += 15;
  checks.push({
    id: 'tagCount',
    check: 'Tag 5-15 buah',
    passed: tagCountValid,
    points: 15,
  });

  const hasLinks = /https?:\/\//i.test(description);
  if (hasLinks) score += 10;
  checks.push({
    id: 'hasLinks',
    check: 'Memiliki link (sosmed/referensi)',
    passed: hasLinks,
    points: 10,
  });

  const hasTimestamps = /\b\d{1,2}:\d{2}\b/.test(description);
  if (hasTimestamps) score += 10;
  checks.push({
    id: 'hasTimestamps',
    check: 'Memiliki timestamp',
    passed: hasTimestamps,
    points: 10,
  });

  const hasHashtags = /#[\p{L}\p{N}_]+/u.test(description);
  if (hasHashtags) score += 10;
  checks.push({
    id: 'hasHashtags',
    check: 'Memiliki hashtag',
    passed: hasHashtags,
    points: 10,
  });

  const keywordInTitle = extractMainKeyword(title);
  const keywordInDesc = keywordInTitle ? description.toLowerCase().includes(keywordInTitle.toLowerCase()) : false;
  const keywordInTags = keywordInTitle ? tags.some((t) => t.toLowerCase().includes(keywordInTitle.toLowerCase())) : false;

  if (keywordInDesc && keywordInTags) {
    score += 20;
    checks.push({
      id: 'keywordMatch',
      check: 'Kata kunci utama di judul, deskripsi, & tag',
      passed: true,
      points: 20,
    });
  } else if (keywordInDesc || keywordInTags) {
    score += 10;
    checks.push({
      id: 'keywordMatch',
      check: 'Kata kunci utama di judul, deskripsi, & tag',
      passed: 'partial',
      points: 10,
    });
  } else {
    checks.push({
      id: 'keywordMatch',
      check: 'Kata kunci utama di judul, deskripsi, & tag',
      passed: false,
      points: 0,
    });
  }

  return { score: Math.min(100, score), checks };
}

export function calculateKeywordRelevance(title = '', description = '', tags = []) {
  const titleTokens = tokenize(title);
  const descTokens = tokenize(description);
  const tagTokens = tags.flatMap((t) => tokenize(t));

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

export function tokenize(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 2);
}

export function calculateOutlierRatio(videoViews, channelAvgViews) {
  if (channelAvgViews <= 0 || videoViews <= 0) return null;
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

  return {
    min,
    max,
    currency: 'IDR',
    label: 'Estimasi kasar',
    note: 'Berdasarkan estimasi rentang RPM kategori di Indonesia (Rp' + (range.min / 1000) + 'rb - Rp' + (range.max / 1000) + 'rb per 1.000 tayangan)',
  };
}
