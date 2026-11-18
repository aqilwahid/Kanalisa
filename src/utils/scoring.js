(function (root, factory) {
  const exports = factory();
  if (typeof module === 'object' && module.exports) module.exports = exports;
  else root.Kanalisa = Object.assign(root.Kanalisa || {}, exports);
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const WEIGHTS = Object.freeze({ speed: 0.35, engagement: 0.25, seo: 0.20, keyword: 0.20 });
  const STOPWORDS = new Set(['yang', 'dan', 'untuk', 'dengan', 'dari', 'pada', 'atau', 'ini', 'itu', 'cara', 'the', 'and', 'for']);

  const clamp = (value, min = 0, max = 100) => Math.min(max, Math.max(min, value));
  const scoreRelative = (value, median) => {
    if (median <= 0) return 50;
    return Math.round(clamp(((Math.log10(Math.max(0.1, value / median)) + 1) / 2) * 100));
  };

  function tokenize(text) {
    return String(text || '').toLocaleLowerCase('id-ID').replace(/[^\p{L}\p{N}\s]/gu, ' ').split(/\s+/)
      .filter((token) => token.length > 2 && !STOPWORDS.has(token));
  }

  function calculateSeo(title, description, tags) {
    const checks = [
      { id: 'titleLength', passed: title.length >= 40 && title.length <= 100, points: 20 },
      { id: 'descriptionLength', passed: description.length >= 150, points: 15 },
      { id: 'tagCount', passed: tags.length >= 5 && tags.length <= 15, points: 15 },
      { id: 'hasLinks', passed: /https?:\/\//i.test(description), points: 10 },
      { id: 'hasTimestamps', passed: /\b\d{1,2}:\d{2}\b/.test(description), points: 10 },
      { id: 'hasHashtags', passed: /#[\p{L}\p{N}_]+/u.test(description), points: 10 },
    ];
    const titleTokens = tokenize(title);
    const otherTokens = new Set([...tokenize(description), ...tags.flatMap(tokenize)]);
    checks.push({ id: 'keywordMatch', passed: titleTokens.some((token) => otherTokens.has(token)), points: 20 });
    return { score: checks.reduce((total, check) => total + (check.passed ? check.points : 0), 0), checks };
  }

  function cosineSimilarity(leftTokens, rightTokens) {
    const left = new Set(leftTokens);
    const right = new Set(rightTokens);
    if (!left.size || !right.size) return 0;
    const dot = [...left].filter((token) => right.has(token)).length;
    return dot / Math.sqrt(left.size * right.size);
  }

  function calculateKanalisaScore(video, benchmarks = {}) {
    const views = Number(video.views || video.viewCount || 0);
    const likes = Number(video.likes || video.likeCount || 0);
    const comments = Number(video.comments || video.commentCount || 0);
    const title = String(video.title || '');
    const description = String(video.description || '');
    const tags = Array.isArray(video.tags) ? video.tags : [];
    const hours = Math.max(1, (Date.now() - new Date(video.publishedAt || Date.now()).getTime()) / 3600000);
    const viewsPerHour = views / hours;
    const speed = scoreRelative(viewsPerHour, Number(benchmarks.medianVph || 0));
    const engagementRate = views ? (likes + comments) / views : 0;
    const engagement = scoreRelative(engagementRate, Number(benchmarks.categoryMedianEngagement || 0));
    const seo = calculateSeo(title, description, tags);
    const keyword = Math.round(cosineSimilarity(tokenize(title), [...tokenize(description), ...tags.flatMap(tokenize)]) * 100);
    const total = Math.round(speed * WEIGHTS.speed + engagement * WEIGHTS.engagement + seo.score * WEIGHTS.seo + keyword * WEIGHTS.keyword);

    return {
      total: clamp(total),
      breakdown: { speed, engagement, seo: seo.score, keyword },
      checks: seo.checks,
      metrics: { viewsPerHour, engagementRate, hoursSincePublish: hours },
    };
  }

  function getKeywordOpportunityLevel(score) {
    if (score >= 70) return 'high';
    if (score >= 40) return 'medium';
    return 'low';
  }

  function calculateKeywordOpportunity({ volume = 0, competition = 0 }) {
    const relativeVolume = clamp(Number(volume));
    const competitionScore = clamp(Number(competition));
    const score = Math.round(clamp(relativeVolume * (100 - competitionScore) / 100));
    return { volume: relativeVolume, competition: competitionScore, score, label: getKeywordOpportunityLevel(score) };
  }

  return { WEIGHTS, calculateSeo, calculateKanalisaScore, calculateKeywordOpportunity, getKeywordOpportunityLevel, tokenize };
});
