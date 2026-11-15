// Mock data keyword deterministik untuk testing tanpa YouTube Search API
// Menghilangkan Math.random() agar hasil pencarian konsisten & dapat diuji ulang.

function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

const MOCK_KEYWORD_DATA = {
  'ayam geprek': {
    query: 'ayam geprek',
    volumeRelative: 78,
    competition: 64,
    opportunityScore: 28,
    label: 'Rendah',
    relatedKeywords: [
      { keyword: 'cara membuat ayam geprek', volumeRelative: 82, competition: 58, opportunityScore: 34, label: 'Rendah' },
      { keyword: 'ayam geprek sambal matah', volumeRelative: 75, competition: 52, opportunityScore: 36, label: 'Rendah' },
      { keyword: 'resep ayam geprek rumahan', volumeRelative: 80, competition: 60, opportunityScore: 32, label: 'Rendah' },
      { keyword: 'ayam geprek enak', volumeRelative: 70, competition: 45, opportunityScore: 39, label: 'Rendah' },
      { keyword: 'cara nggeprek ayam', volumeRelative: 65, competition: 38, opportunityScore: 40, label: 'Sedang' },
      { keyword: 'ayam geprek pedas', volumeRelative: 72, competition: 55, opportunityScore: 32, label: 'Rendah' },
      { keyword: 'ayam geprek original', volumeRelative: 60, competition: 40, opportunityScore: 36, label: 'Rendah' },
      { keyword: 'bumbu ayam geprek', volumeRelative: 68, competition: 50, opportunityScore: 34, label: 'Rendah' },
      { keyword: 'ayam geprek diet', volumeRelative: 45, competition: 30, opportunityScore: 32, label: 'Rendah' },
      { keyword: 'ayam geprek air fryer', volumeRelative: 55, competition: 35, opportunityScore: 36, label: 'Rendah' },
    ],
  },
  'capcut': {
    query: 'capcut',
    volumeRelative: 92,
    competition: 78,
    opportunityScore: 20,
    label: 'Rendah',
    relatedKeywords: [
      { keyword: 'cara edit video capcut', volumeRelative: 88, competition: 72, opportunityScore: 25, label: 'Rendah' },
      { keyword: 'tutorial capcut pemula', volumeRelative: 85, competition: 68, opportunityScore: 27, label: 'Rendah' },
      { keyword: 'capcut edit video hp', volumeRelative: 80, competition: 65, opportunityScore: 28, label: 'Rendah' },
      { keyword: 'efek capcut keren', volumeRelative: 75, competition: 60, opportunityScore: 30, label: 'Rendah' },
      { keyword: 'capcut template gratis', volumeRelative: 78, competition: 55, opportunityScore: 35, label: 'Rendah' },
      { keyword: 'ngedit video capcut', volumeRelative: 70, competition: 48, opportunityScore: 36, label: 'Rendah' },
      { keyword: 'capcut pro apk', volumeRelative: 65, competition: 40, opportunityScore: 39, label: 'Rendah' },
      { keyword: 'transisi capcut smooth', volumeRelative: 72, competition: 52, opportunityScore: 35, label: 'Rendah' },
      { keyword: 'text animation capcut', volumeRelative: 68, competition: 45, opportunityScore: 37, label: 'Rendah' },
      { keyword: 'capcut untuk pemula', volumeRelative: 82, competition: 70, opportunityScore: 25, label: 'Rendah' },
    ],
  },
  'hp gaming': {
    query: 'hp gaming',
    volumeRelative: 85,
    competition: 70,
    opportunityScore: 26,
    label: 'Rendah',
    relatedKeywords: [
      { keyword: 'hp gaming budget 3 juta', volumeRelative: 80, competition: 65, opportunityScore: 28, label: 'Rendah' },
      { keyword: 'hp gaming murah 2024', volumeRelative: 82, competition: 68, opportunityScore: 26, label: 'Rendah' },
      { keyword: 'hp gaming untuk mlbb', volumeRelative: 78, competition: 60, opportunityScore: 31, label: 'Rendah' },
      { keyword: 'hp gaming genshin impact', volumeRelative: 75, competition: 58, opportunityScore: 32, label: 'Rendah' },
      { keyword: 'rekomendasi hp gaming', volumeRelative: 80, competition: 62, opportunityScore: 30, label: 'Rendah' },
      { keyword: 'hp gaming 2 jutaan', volumeRelative: 70, competition: 50, opportunityScore: 35, label: 'Rendah' },
      { keyword: 'hp gaming 4 jutaan', volumeRelative: 72, competition: 55, opportunityScore: 32, label: 'Rendah' },
      { keyword: 'infinix gt 10 pro review', volumeRelative: 65, competition: 45, opportunityScore: 36, label: 'Rendah' },
      { keyword: 'poco x6 pro gaming', volumeRelative: 68, competition: 48, opportunityScore: 35, label: 'Rendah' },
      { keyword: 'hp gaming second', volumeRelative: 55, competition: 35, opportunityScore: 36, label: 'Rendah' },
    ],
  },
  'resep masakan': {
    query: 'resep masakan',
    volumeRelative: 90,
    competition: 75,
    opportunityScore: 23,
    label: 'Rendah',
    relatedKeywords: [
      { keyword: 'resep masakan rumahan', volumeRelative: 88, competition: 70, opportunityScore: 26, label: 'Rendah' },
      { keyword: 'resep masakan sederhana', volumeRelative: 85, competition: 65, opportunityScore: 30, label: 'Rendah' },
      { keyword: 'resep masakan enak', volumeRelative: 82, competition: 60, opportunityScore: 33, label: 'Rendah' },
      { keyword: 'resep masakan hemat', volumeRelative: 78, competition: 55, opportunityScore: 35, label: 'Rendah' },
      { keyword: 'resep masakan untuk pemula', volumeRelative: 80, competition: 58, opportunityScore: 34, label: 'Rendah' },
      { keyword: 'masak apa hari ini', volumeRelative: 75, competition: 50, opportunityScore: 38, label: 'Rendah' },
      { keyword: 'menu sahur praktis', volumeRelative: 70, competition: 45, opportunityScore: 39, label: 'Rendah' },
      { keyword: 'resep buka puasa', volumeRelative: 72, competition: 48, opportunityScore: 37, label: 'Rendah' },
      { keyword: 'masakan rumahan favorit', volumeRelative: 68, competition: 42, opportunityScore: 39, label: 'Rendah' },
      { keyword: 'ide masak malam', volumeRelative: 65, competition: 38, opportunityScore: 40, label: 'Sedang' },
    ],
  },
  'tutorial': {
    query: 'tutorial',
    volumeRelative: 88,
    competition: 72,
    opportunityScore: 25,
    label: 'Rendah',
    relatedKeywords: [
      { keyword: 'tutorial edit video', volumeRelative: 85, competition: 68, opportunityScore: 27, label: 'Rendah' },
      { keyword: 'tutorial capcut', volumeRelative: 82, competition: 65, opportunityScore: 29, label: 'Rendah' },
      { keyword: 'tutorial youtube pemula', volumeRelative: 78, competition: 60, opportunityScore: 31, label: 'Rendah' },
      { keyword: 'tutorial membuat thumbnail', volumeRelative: 75, competition: 55, opportunityScore: 34, label: 'Rendah' },
      { keyword: 'tutorial seo youtube', volumeRelative: 70, competition: 50, opportunityScore: 35, label: 'Rendah' },
      { keyword: 'tutorial belajar editing', volumeRelative: 72, competition: 52, opportunityScore: 35, label: 'Rendah' },
      { keyword: 'tutorial after effects', volumeRelative: 65, competition: 45, opportunityScore: 36, label: 'Rendah' },
      { keyword: 'tutorial premiere pro', volumeRelative: 68, competition: 48, opportunityScore: 35, label: 'Rendah' },
      { keyword: 'tutorial davinci resolve', volumeRelative: 60, competition: 40, opportunityScore: 36, label: 'Rendah' },
      { keyword: 'tutorial kinemaster', volumeRelative: 70, competition: 55, opportunityScore: 32, label: 'Rendah' },
    ],
  },
};

export function calculateOpportunityScore(volume, competition) {
  const v = Math.min(100, Math.max(0, Number(volume) || 0));
  const c = Math.min(100, Math.max(0, Number(competition) || 0));
  return Math.round((v * (100 - c)) / 100);
}

export function getOpportunityLabel(score) {
  if (score >= 70) return 'Peluang Tinggi';
  if (score >= 40) return 'Sedang';
  return 'Rendah';
}

export function generateMockKeywords(query) {
  const lowerQuery = String(query || '').toLowerCase().trim();

  for (const [key, data] of Object.entries(MOCK_KEYWORD_DATA)) {
    if (lowerQuery === key || (lowerQuery.length > 3 && (lowerQuery.includes(key) || key.includes(lowerQuery)))) {
      return {
        ...data,
        query,
        isMock: true,
        source: 'mock',
        searchedAt: new Date().toISOString(),
      };
    }
  }

  // Hashing deterministik berbasis string kata kunci
  const seed = hashString(lowerQuery);
  const volume = 40 + (seed % 50); // 40..89
  const competition = 30 + ((seed >> 2) % 55); // 30..84
  const score = calculateOpportunityScore(volume, competition);

  const baseKeywords = [
    `cara ${lowerQuery}`,
    `tutorial ${lowerQuery}`,
    `${lowerQuery} pemula`,
    `${lowerQuery} terbaru`,
    `${lowerQuery} lengkap`,
    `${lowerQuery} mudah`,
    `${lowerQuery} di hp`,
    `tips ${lowerQuery}`,
    `belajar ${lowerQuery}`,
    `rekomendasi ${lowerQuery}`,
  ];

  return {
    query,
    volumeRelative: volume,
    competition,
    opportunityScore: score,
    label: getOpportunityLabel(score),
    isMock: true,
    source: 'mock',
    relatedKeywords: baseKeywords.map((kw, i) => {
      const kwSeed = hashString(kw);
      const kwVol = Math.max(25, volume - 5 - (kwSeed % 15));
      const kwComp = Math.max(20, competition - (i % 2 === 0 ? 10 : -5));
      const kwScore = calculateOpportunityScore(kwVol, kwComp);
      return {
        keyword: kw,
        volumeRelative: kwVol,
        competition: kwComp,
        opportunityScore: kwScore,
        label: getOpportunityLabel(kwScore),
      };
    }),
    searchedAt: new Date().toISOString(),
  };
}

export async function searchKeywords(query) {
  return generateMockKeywords(query);
}

export async function getRelatedKeywords(query) {
  const result = generateMockKeywords(query);
  return result.relatedKeywords;
}

export async function getSavedKeywords(userId) {
  return [
    'ayam geprek sambal matah',
    'capcut template gratis',
    'hp gaming budget 3 juta',
  ];
}

export async function saveKeyword(userId, keyword) {
  return { success: true, keyword };
}

export async function deleteSavedKeyword(userId, keyword) {
  return { success: true };
}
