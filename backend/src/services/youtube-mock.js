// Mock data YouTube untuk pengujian lokal & development tanpa API key.
// Memberikan data deterministik untuk video contoh dan video sembarang.

const MOCK_VIDEOS = {
  'dQw4w9WgXcQ': {
    id: 'dQw4w9WgXcQ',
    title: 'Cara Membuat Ayam Geprek Sambal Matah yang Enak Banget',
    description: 'Video ini akan mengajarkan cara membuat ayam geprek sambal matah yang enak dan mudah dibuat di rumah. Bahan-bahannya sederhana dan bisa didapat di pasar tradisional.\n\nBahan:\n- Ayam 500gr\n- Bawang putih 3 siung\n- Bawang merah 5 siung\n- Cabai rawit 10 biji\n- Jeruk limau 1 buah\n- Garam, gula, penyedap secukupnya\n\nIkuti langkah-langkahnya ya! Jangan lupa like, subscribe, dan share ke temen-temen.\n\nTimestamp:\n00:00 Intro\n01:30 Persiapan bahan\n03:45 Menggoreng ayam\n06:20 Membuat sambal matah\n08:10 Penyajian\n\nFollow IG: https://instagram.com/masakansederhana\n#ayamgeprek #resepmasakan #masakansederhana #tutorialmasak',
    publishedAt: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
    channelId: 'UC123456789',
    channelTitle: 'Masakan Sederhana',
    tags: ['ayam geprek', 'resep masakan', 'masakan sederhana', 'tutorial masak', 'sambal matah', 'cara memasak', 'masakan rumahan', 'enak', 'mudah', 'hemat'],
    thumbnails: {
      default: { url: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/default.jpg' },
      medium: { url: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/mqdefault.jpg' },
      high: { url: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg' },
    },
    duration: 'PT12M34S',
    viewCount: 125000,
    likeCount: 5200,
    commentCount: 850,
  },
  'abc123def456': {
    id: 'abc123def456',
    title: '5 Tips Edit Video CapCut di HP untuk Pemula',
    description: 'Belajar edit video di HP menggunakan CapCut. Cocok untuk pemula yang mau bikin konten YouTube/Shorts/Reels.\n\nTimestamp:\n00:00 Intro\n01:30 Import video\n03:45 Potong & gabung\n06:20 Tambah teks & stiker\n08:10 Export kualitas tinggi\n\nLink download CapCut: https://capcut.com\n#capcut #editvideo #tutorial #pemula #contentcreator',
    publishedAt: new Date(Date.now() - 72 * 3600 * 1000).toISOString(),
    channelId: 'UC123456789',
    channelTitle: 'Masakan Sederhana',
    tags: ['capcut', 'edit video', 'tutorial', 'pemula', 'content creator', 'hp', 'android', 'ios', 'gratis', 'mudah'],
    thumbnails: {
      default: { url: 'https://i.ytimg.com/vi/abc123def456/default.jpg' },
      medium: { url: 'https://i.ytimg.com/vi/abc123def456/mqdefault.jpg' },
      high: { url: 'https://i.ytimg.com/vi/abc123def456/hqdefault.jpg' },
    },
    duration: 'PT10M15S',
    viewCount: 89000,
    likeCount: 3800,
    commentCount: 420,
  },
  'xyz789uvw000': {
    id: 'xyz789uvw000',
    title: 'Review HP Gaming Terbaik Bawah 3 Jutaan 2024',
    description: 'Review 5 HP gaming terbaik budget 3 jutaan. Cocok buat main MLBB, CODM, Genshin Impact lancar.\n\nDaftar HP:\n1. Infinix GT 10 Pro\n2. POCO X6 Pro\n3. Realme 11 Pro\n4. Redmi Note 13 Pro\n5. Motorola Edge 40 Neo\n\nSpesifikasi lengkap di deskripsi tiap HP.\n\nBeli via link afiliasi (support channel):\nhttps://shopee.co.id/shop/teknoreview\n#hpgaming #reviewhp #budget3juta #mobilelegends #genshinimpact #teknologi',
    publishedAt: new Date(Date.now() - 120 * 3600 * 1000).toISOString(),
    channelId: 'UC987654321',
    channelTitle: 'Tekno Review',
    tags: ['hp gaming', 'review hp', 'budget 3 juta', 'mobile legends', 'genshin impact', 'infinix', 'poco', 'realme', 'redmi', 'motorola', '2024', 'terbaik', 'spesifikasi', 'harga', 'rekomendasi'],
    thumbnails: {
      default: { url: 'https://i.ytimg.com/vi/xyz789uvw000/default.jpg' },
      medium: { url: 'https://i.ytimg.com/vi/xyz789uvw000/mqdefault.jpg' },
      high: { url: 'https://i.ytimg.com/vi/xyz789uvw000/hqdefault.jpg' },
    },
    duration: 'PT15M42S',
    viewCount: 245000,
    likeCount: 12000,
    commentCount: 1800,
  },
};

const MOCK_CHANNELS = {
  'UC123456789': {
    id: 'UC123456789',
    title: 'Masakan Sederhana',
    description: 'Channel masakan rumahan sederhana, enak, dan hemat. Cocok untuk pemula yang mau belajar masak.',
    publishedAt: '2023-01-15T00:00:00Z',
    thumbnails: {
      default: { url: 'https://yt3.ggpht.com/channel1/default.jpg' },
      medium: { url: 'https://yt3.ggpht.com/channel1/medium.jpg' },
      high: { url: 'https://yt3.ggpht.com/channel1/high.jpg' },
    },
    subscriberCount: 125000,
    videoCount: 87,
    viewCount: 12500000,
  },
  'UC987654321': {
    id: 'UC987654321',
    title: 'Tekno Review',
    description: 'Review gadget, HP, laptop, dan aksesoris teknologi. Jujur, detail, dan update.',
    publishedAt: '2022-06-20T00:00:00Z',
    thumbnails: {
      default: { url: 'https://yt3.ggpht.com/channel2/default.jpg' },
      medium: { url: 'https://yt3.ggpht.com/channel2/medium.jpg' },
      high: { url: 'https://yt3.ggpht.com/channel2/high.jpg' },
    },
    subscriberCount: 580000,
    videoCount: 234,
    viewCount: 85000000,
  },
};

function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function generateDeterministicVideo(videoId) {
  const seed = hashString(videoId);
  const views = 15000 + (seed % 450000);
  const likes = Math.round(views * (0.02 + ((seed % 50) / 1000)));
  const comments = Math.round(likes * 0.12);
  const hoursAgo = 12 + (seed % 240);
  const channelId = `UC_mock_${(seed % 9999).toString().padStart(4, '0')}`;

  return {
    id: videoId,
    title: `Tutorial Lengkap Belajar Konten Kreator untuk Pemula [${videoId.slice(0, 6)}]`,
    description: `Panduan langkah demi langkah untuk membuat konten YouTube berkualitas tinggi.\n\nTimestamp:\n00:00 Pembuka\n01:30 Persiapan alat\n04:00 Tips optimasi judul & tag\n07:30 Kesimpulan\n\nInfo selengkapnya: https://kanalisa.id\n#tutorial #kreator #indonesia #youtube`,
    publishedAt: new Date(Date.now() - hoursAgo * 3600 * 1000).toISOString(),
    channelId,
    channelTitle: `Kanal Kreator ID ${(seed % 100)}`,
    tags: ['tutorial', 'pemula', 'kreator', 'indonesia', 'youtube', 'tips', 'konten', 'video', 'panduan', 'cara'],
    thumbnails: {
      default: { url: `https://i.ytimg.com/vi/${videoId}/default.jpg` },
      medium: { url: `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg` },
      high: { url: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` },
    },
    duration: 'PT8M45S',
    viewCount: views,
    likeCount: likes,
    commentCount: comments,
  };
}

function generateDeterministicChannel(channelId) {
  const seed = hashString(channelId);
  const subscribers = 10000 + (seed % 350000);
  const videoCount = 20 + (seed % 150);
  const viewCount = subscribers * (15 + (seed % 40));

  return {
    id: channelId,
    title: `Kanal Kreator ID ${(seed % 100)}`,
    description: 'Kanal edukasi dan tips konten kreator Indonesia.',
    publishedAt: new Date(Date.now() - 365 * 24 * 3600 * 1000).toISOString(),
    thumbnails: {
      default: { url: 'https://yt3.ggpht.com/channel/default.jpg' },
      medium: { url: 'https://yt3.ggpht.com/channel/medium.jpg' },
      high: { url: 'https://yt3.ggpht.com/channel/high.jpg' },
    },
    subscriberCount: subscribers,
    videoCount,
    viewCount,
  };
}

export async function getVideoStats(videoId) {
  if (MOCK_VIDEOS[videoId]) {
    return { ...MOCK_VIDEOS[videoId] };
  }
  return generateDeterministicVideo(videoId);
}

export async function getChannelStats(channelId) {
  if (!channelId) return null;
  if (MOCK_CHANNELS[channelId]) {
    return { ...MOCK_CHANNELS[channelId] };
  }
  return generateDeterministicChannel(channelId);
}

export async function getVideosBatch(videoIds) {
  return videoIds.map((id) => (MOCK_VIDEOS[id] ? { ...MOCK_VIDEOS[id] } : generateDeterministicVideo(id)));
}

export async function getChannelsBatch(channelIds) {
  return channelIds.map((id) => (MOCK_CHANNELS[id] ? { ...MOCK_CHANNELS[id] } : generateDeterministicChannel(id)));
}

export async function searchVideosMock(query, options = {}) {
  const allVideos = Object.values(MOCK_VIDEOS);
  const filtered = allVideos.filter((v) =>
    v.title.toLowerCase().includes(query.toLowerCase()) ||
    v.tags.some((t) => t.toLowerCase().includes(query.toLowerCase()))
  );

  if (filtered.length >= (options.maxResults || 20)) {
    return filtered.slice(0, options.maxResults || 20);
  }

  // Lengkapi dengan mock video deterministik jika kurang
  const needed = (options.maxResults || 20) - filtered.length;
  for (let i = 0; i < needed; i++) {
    const syntheticId = `mock_${hashString(query + i).toString(36).slice(0, 11)}`;
    const synthetic = generateDeterministicVideo(syntheticId);
    synthetic.title = `${query} - Panduan Bagian ${i + 1}`;
    filtered.push(synthetic);
  }

  return filtered.slice(0, options.maxResults || 20);
}

export function getAllMockVideoIds() {
  return Object.keys(MOCK_VIDEOS);
}

export function getAllMockChannelIds() {
  return Object.keys(MOCK_CHANNELS);
}
