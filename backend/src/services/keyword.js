import { searchVideos, getVideos, getChannels } from './youtube.js';

const INDONESIAN_STOPWORDS = new Set([
  'yang', 'dan', 'di', 'ke', 'dari', 'untuk', 'dengan', 'pada', 'adalah', 'ini',
  'itu', 'atau', 'juga', 'sudah', 'belum', 'bisa', 'tidak', 'ada', 'akan',
  'saya', 'kamu', 'dia', 'kami', 'kita', 'mereka', 'nya', 'ku', 'mu',
]);

export function normalizeIndonesianText(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function tokenizeIndonesian(text) {
  const normalized = normalizeIndonesianText(text);
  return normalized
    .split(' ')
    .filter(token => token.length > 1 && !INDONESIAN_STOPWORDS.has(token));
}

export function calculateCosineSimilarity(tokensA, tokensB) {
  const setA = new Set(tokensA);
  const setB = new Set(tokensB);
  const intersection = [...setA].filter(x => setB.has(x)).length;
  const union = new Set([...tokensA, ...tokensB]).size;
  return union === 0 ? 0 : intersection / union;
}

export async function searchKeyword(query, options = {}) {
  const { limit = 20, useCache = true } = options;
  
  const cacheKey = `keyword:search:${query.toLowerCase()}`;
  
  return {
    query,
    volumeRelative: calculateVolumeRelative(query),
    competition: await calculateCompetition(query, limit),
    opportunityScore: 0,
    label: '',
    relatedKeywords: await getRelatedKeywords(query),
    searchedAt: new Date().toISOString(),
  };
}

export function calculateVolumeRelative(query) {
  const baseScore = Math.min(query.length * 2, 50);
  const wordCount = query.split(' ').length;
  const wordBonus = wordCount > 2 ? 15 : wordCount * 5;
  const trendBonus = Math.floor(Math.random() * 20);
  
  return Math.min(100, baseScore + wordBonus + trendBonus);
}

async function calculateCompetition(query, limit) {
  try {
    const searchResults = await searchVideos(query, { maxResults: limit });
    const videoIds = searchResults.map(r => r.id.videoId).filter(Boolean);
    
    if (!videoIds.length) return 50;
    
    const videos = await getVideos(videoIds);
    const channelIds = [...new Set(videos.map(v => v.snippet?.channelId).filter(Boolean))];
    const channels = await getChannels(channelIds);
    
    const channelMap = new Map(channels.map(c => [c.id, c]));
    
    let totalViews = 0;
    let totalSubscribers = 0;
    let exactMatchCount = 0;
    
    for (const video of videos) {
      const stats = video.statistics || {};
      totalViews += parseInt(stats.viewCount || '0', 10);
      
      const channel = channelMap.get(video.snippet?.channelId);
      if (channel) {
        totalSubscribers += parseInt(channel.statistics?.subscriberCount || '0', 10);
      }
      
      const title = (video.snippet?.title || '').toLowerCase();
      if (title.includes(query.toLowerCase())) {
        exactMatchCount++;
      }
    }
    
    const avgViews = totalViews / videos.length || 0;
    const avgSubscribers = totalSubscribers / channelIds.length || 0;
    const exactMatchRatio = exactMatchCount / videos.length;
    
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
  const variations = [
    query,
    query.replace(/\s+/g, ''),
    `cara ${query}`,
    `tutorial ${query}`,
    `${query} terbaru`,
    `${query} 2024`,
    `${query} indonesia`,
    `${query} mudah`,
    `${query} pemula`,
    `${query} hp`,
    `${query} android`,
    `${query} gratis`,
  ];
  
  const gaulVariations = [
    query.replace(/cara /, 'cara ng'),
    query.replace(/meng/, 'ng'),
    query.replace(/men/, 'n'),
    query.replace(/kan$/, 'in'),
    query.replace(/nya$/, 'nye'),
  ];
  
  const allVariations = [...new Set([...variations, ...gaulVariations])]
    .filter(v => v !== query && v.length > 2)
    .slice(0, 15);
  
  return allVariations.map(v => ({
    keyword: v,
    volumeRelative: calculateVolumeRelative(v),
    competition: 50,
    opportunityScore: 0,
    label: '',
  }));
}

export function calculateOpportunityScore(volumeRelative, competition) {
  const score = (volumeRelative * (100 - competition)) / 100;
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

export async function getKeywordSuggestions(query) {
  const baseResult = await searchKeyword(query);
  const enriched = enrichKeywordResult(baseResult);
  
  const relatedEnriched = await Promise.all(
    baseResult.relatedKeywords.map(async (kw) => {
      const comp = await calculateCompetition(kw.keyword, 10);
      return enrichKeywordResult({ ...kw, competition: comp });
    })
  );
  
  return {
    ...enriched,
    relatedKeywords: relatedEnriched
      .sort((a, b) => b.opportunityScore - a.opportunityScore)
      .slice(0, 10),
  };
}