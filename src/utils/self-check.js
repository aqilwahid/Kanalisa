const assert = require('assert');
const { formatNumber, formatCurrency, formatDate } = require('./format.js');
const { calculateKanalisaScore, calculateKeywordOpportunity, WEIGHTS } = require('./scoring.js');

// 1. formatNumber
assert.strictEqual(formatNumber(1200), '1,2 rb');
assert.strictEqual(formatNumber(3400000), '3,4 jt');
assert.strictEqual(formatNumber(1500000000), '1,5 M');
assert.strictEqual(formatNumber(42), '42');

// 2. formatCurrency
assert.strictEqual(formatCurrency(49000), 'Rp49.000');
assert.strictEqual(formatCurrency(0), 'Rp0');

// 3. formatDate
const fixedDate = new Date('2026-11-14T05:30:00Z'); // 12:30 WIB
assert.strictEqual(formatDate(fixedDate), '14 Nov 2026');

// 4. scoring weights
const totalWeight = Object.values(WEIGHTS).reduce((sum, w) => sum + w, 0);
assert(Math.abs(totalWeight - 1.0) < 1e-6, 'Bobot Skor Kanalisa harus berjumlah 1.0');

// 5. calculateKanalisaScore bounded 0..100
const testVideo = {
  title: 'Tutorial Belajar Pemrograman Lengkap Untuk Pemula #shorts',
  description: 'Panduan lengkap belajar coding pemula dari nol. Kunjungi https://kanalisa.id untuk info lebih lanjut. 00:00 Mulai 01:30 Setup.',
  tags: ['tutorial', 'pemula', 'coding', 'belajar', 'program'],
  views: 100000,
  likes: 4500,
  comments: 320,
  publishedAt: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
};
const benchmarks = { channelMedianVph: 1500, categoryMedianEngagement: 0.035 };
const scoreResult = calculateKanalisaScore(testVideo, benchmarks);
assert(scoreResult.total >= 0 && scoreResult.total <= 100, 'Skor harus dalam rentang 0-100');
assert.strictEqual(typeof scoreResult.total, 'number');
assert.strictEqual(scoreResult.checks.length, 7, 'SEO checklist harus 7 poin sesuai PRD');

// 6. calculateKeywordOpportunity formula: volume * (100 - competition) / 100
const oppHigh = calculateKeywordOpportunity({ volume: 90, competition: 15 });
assert.strictEqual(oppHigh.score, Math.round(90 * (100 - 15) / 100)); // 77
assert.strictEqual(oppHigh.label, 'high');

const oppMed = calculateKeywordOpportunity({ volume: 60, competition: 30 });
assert.strictEqual(oppMed.score, Math.round(60 * 70 / 100)); // 42
assert.strictEqual(oppMed.label, 'medium');

const oppLow = calculateKeywordOpportunity({ volume: 20, competition: 80 });
assert.strictEqual(oppLow.score, Math.round(20 * 20 / 100)); // 4
assert.strictEqual(oppLow.label, 'low');

console.log('Semua pengecekan self-check lolos 100%.');
