import { isMockMode, searchVideos, getVideos, getChannels } from './youtube.js';
import { generateMockKeywords } from './keyword-mock.js';

const INDONESIAN_STOPWORDS = new Set([
  'yang', 'dan', 'di', 'ke', 'dari', 'untuk', 'dengan', 'pada', 'adalah', 'ini',
  'itu', 'atau', 'juga', 'sudah', 'belum', 'bisa', 'tidak', 'ada', 'akan',
  'saya', 'kamu', 'dia', 'kami', 'kita', 'mereka', 'nya', 'ku', 'mu',
]);

function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function normalizeIndonesianText(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function tokenizeIndonesian(text) {
  const normalized = normalizeIndonesianText(text);
  return normalized
    .split(' ')
    .filter((token) => token.length > 1 && !INDONESIAN_STOPWORDS.has(token));
}

export function calculateCosineSimilarity(tokensA, tokensB) {
  const setA = new Set(tokensA);
  const setB = new Set(tokensB);
  const intersection = [...setA].filter((x) => setB.has(x)).length;
  const union = new Set([...tokensA, ...tokensB]).size;
  return union === 0 ? 0 : intersection / union;
}

export function calculateVolumeRelative(query) {
  const clean = String(query || '').trim();
  const baseScore = Math.min(clean.length * 2, 50);
  const wordCount = clean.split(/\s+/).filter(Boolean).length;
  const wordBonus = wordCount > 2 ? 15 : wordCount * 5;
  // Bonus deterministik berbasis hash karakter (bukan Math.random)
  const hashBonus = hashString(clean) % 20;

  return Math.min(100, Math.max(10, baseScore + wordBonus + hashBonus));
}

export function calculateOpportunityScore(volumeRelative, competition) {
  const score = (Number(volumeRelative || 0) * (100 - Number(competition || 0))) / 100;
  return Math.round(Math.min(100, Math.max(0, score)));
}

export function getOpportunityLabel(score) {
  if (score >= 70) return 'Peluang Tinggi';
  if (score >= 40) return 'Sedang';
  return 'Rendah';
}

export function enrichKeywordResult(result) {
  const score = calculateOpportunityScore(result.volumeRelative, result.competition);
  return {
    ...result,
    opportunityScore: score,
    label: getOpportunityLabel(score),
  };
}

async function calculateCompetition(query, limit) {
  try {
    const searchResults = await searchVideos(query, { maxResults: limit });
    const videoIds = searchResults.map((r) => r.id?.videoId || r.id).filter(Boolean);

    if (!videoIds.length) return 50;

    const videos = await getVideos(videoIds);
    const channelIds = [...new Set(videos.map((v) => v.snippet?.channelId || v.channelId).filter(Boolean))];
    const channels = await getChannels(channelIds);

    const channelMap = new Map(channels.map((c) => [c.id, c]));

    let totalViews = 0;
    let totalSubscribers = 0;
    let exactMatchCount = 0;

    for (const video of videos) {
      const stats = video.statistics || {};
      totalViews += parseInt(stats.viewCount ?? video.viewCount ?? '0', 10);

      const chId = video.snippet?.channelId || video.channelId;
      const channel = channelMap.get(chId);
      if (channel) {
        totalSubscribers += parseInt(channel.statistics?.subscriberCount ?? channel.subscriberCount ?? '0', 10);
      }

      const title = (video.snippet?.title || video.title || '').toLowerCase();
      if (title.includes(query.toLowerCase())) {
        exactMatchCount++;
      }
    }

    const avgViews = totalViews / Math.max(1, videos.length);
    const avgSubscribers = totalSubscribers / Math.max(1, channelIds.length);
    const exactMatchRatio = exactMatchCount / Math.max(1, videos.length);

    const viewsScore = Math.min(50, Math.log10(avgViews + 1) * 10);
    const subsScore = Math.min(30, Math.log10(avgSubscribers + 1) * 5);
    const exactMatchScore = exactMatchRatio * 20;

    return Math.min(100, Math.round(viewsScore + subsScore + exactMatchScore));
  } catch (err) {
    console.error('Competition calculation error:', err.message);
    return 50;
  }
}

async function getRelatedKeywords(query) {
  const clean = String(query || '').trim().toLowerCase();
  const variations = [
    clean,
    `cara ${clean}`,
    `tutorial ${clean}`,
    `${clean} terbaru`,
    `${clean} pemula`,
    `${clean} mudah`,
    `${clean} di hp`,
    `${clean} lengkap`,
    `tips ${clean}`,
    `rekomendasi ${clean}`,
  ];

  const gaulVariations = [
    clean.replace(/^cara /, 'cara ng'),
    clean.replace(/meng/, 'ng'),
    clean.replace(/kan$/, 'in'),
  ];

  const allVariations = [...new Set([...variations, ...gaulVariations])]
    .filter((v) => v !== clean && v.length > 2)
    .slice(0, 15);

  return allVariations.map((v) => ({
    keyword: v,
    volumeRelative: calculateVolumeRelative(v),
    competition: 50,
    opportunityScore: 0,
    label: '',
  }));
}

export async function searchKeyword(query, options = {}) {
  const { limit = 20, useCache = true, keywordCache } = options;

  if (isMockMode) {
    return generateMockKeywords(query);
  }

  // Cek cache
  if (useCache && keywordCache) {
    const cached = await keywordCache.get(query);
    if (cached) {
      return cached;
    }
  }

  const result = {
    query,
    volumeRelative: calculateVolumeRelative(query),
    competition: await calculateCompetition(query, limit),
    opportunityScore: 0,
    label: '',
    relatedKeywords: await getRelatedKeywords(query),
    isMock: false,
    source: 'youtube-v3',
    searchedAt: new Date().toISOString(),
  };

  const enriched = enrichKeywordResult(result);

  if (useCache && keywordCache) {
    await keywordCache.set(query, enriched, 24);
  }

  return enriched;
}

export async function getKeywordSuggestions(query, options = {}) {
  const { keywordCache, tier = 'free' } = options;

  if (isMockMode) {
    const mock = generateMockKeywords(query);
    const maxRelated = tier === 'pro' ? 10 : 5;
    return {
      ...mock,
      relatedKeywords: (mock.relatedKeywords || []).slice(0, maxRelated),
    };
  }

  const baseResult = await searchKeyword(query, { keywordCache });
  const enriched = enrichKeywordResult(baseResult);

  const relatedEnriched = await Promise.all(
    (baseResult.relatedKeywords || []).map(async (kw) => {
      const comp = await calculateCompetition(kw.keyword, 10);
      return enrichKeywordResult({ ...kw, competition: comp });
    })
  );

  const maxRelated = tier === 'pro' ? 10 : 5;
  return {
    ...enriched,
    relatedKeywords: relatedEnriched
      .sort((a, b) => b.opportunityScore - a.opportunityScore)
      .slice(0, maxRelated),
  };
}
