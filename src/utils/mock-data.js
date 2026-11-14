// Data contoh untuk fase 2. Diganti data backend di fase 3.
// Skrip klasik (bukan ES module) agar bisa dimuat content_scripts tanpa bundler.
(function (root, factory) {
  const exports = factory();
  if (typeof module === 'object' && module.exports) module.exports = exports;
  else root.Kanalisa = Object.assign(root.Kanalisa || {}, exports);
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const mockVideo = {
    id: 'dQw4w9WgXcQ',
    title: 'Cara membuat ayam geprek sambal matah yang enak',
    views: 125000, likes: 5000, comments: 800,
    publishedAt: new Date(Date.now() - 48 * 3600000).toISOString(),
    description: 'Tutorial lengkap membuat ayam geprek sambal matah renyah dan pedas segar untuk pemula.\n\n00:00 Pembuka\n01:10 Bahan\n03:30 Menggoreng ayam\n\nResep lengkap: https://example.com/resep\n#ayamgeprek #resep',
    tags: ['ayam geprek', 'resep', 'masak', 'tutorial'],
  };

  // Pembanding kanal/kategori contoh untuk normalisasi skor (§7.1)
  const mockBenchmarks = { channelMedianVph: 1200, categoryMedianEngagement: 0.04 };

  // Kunci dalam huruf kecil. Skor peluang dihitung scoring.js: volume x (100 - persaingan) / 100.
  const mockKeywords = {
    'cara membuat ayam geprek': { volume: 78, competition: 64, related: ['resep ayam geprek', 'ayam geprek sambal matah', 'ayam geprek crispy'] },
    'resep ayam geprek': { volume: 55, competition: 30, related: ['ayam geprek rumahan', 'ayam geprek tepung'] },
    'ayam geprek sambal matah': { volume: 82, competition: 12, related: ['sambal matah', 'ayam geprek pedas'] },
    'ayam geprek': { volume: 92, competition: 85, related: ['cara membuat ayam geprek', 'resep ayam geprek'] },
  };

  const mockUser = { email: 'user@example.com', credits: { remaining: 45, limit: 50 }, keywordQuota: { used: 2, limit: 3 } };

  function getMockKeyword(query) {
    return mockKeywords[String(query || '').trim().toLowerCase()] || null;
  }

  return { mockVideo, mockBenchmarks, mockKeywords, mockUser, getMockKeyword };
});
