import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import app from '../src/index.js';

describe('Kanalisa API Integration Tests', () => {
  let server;
  let baseUrl;
  let authToken;

  beforeAll(async () => {
    await new Promise((resolve) => {
      server = app.listen(0, () => {
        const port = server.address().port;
        baseUrl = `http://127.0.0.1:${port}`;
        resolve();
      });
    });
  });

  afterAll(async () => {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
  });

  it('1. GET /health harus mengembalikan status ok dan informasi mode layanan', async () => {
    const res = await fetch(`${baseUrl}/health`);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.status).toBe('ok');
    expect(data.service).toBe('kanalisa-api');
    expect(data.modes).toBeDefined();
    expect(data.modes.youtube).toBe('mock');
  });

  it('2. POST /api/auth/google (mode dev) harus mengembalikan JWT token dan profil', async () => {
    const res = await fetch(`${baseUrl}/api/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ credential: 'dev-mock' }),
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.token).toBeDefined();
    expect(typeof data.token).toBe('string');
    expect(data.user).toBeDefined();
    expect(data.user.email).toBe('test@example.com');
    authToken = data.token;
  });

  it('3. GET /api/auth/me dengan Bearer token harus memvalidasi pengguna aktif', async () => {
    const res = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.user).toBeDefined();
    expect(data.user.email).toBe('test@example.com');
    expect(data.user.tier).toBe('free');
  });

  it('4. GET /api/user/me harus mengembalikan detail akun yang sinkron', async () => {
    const res = await fetch(`${baseUrl}/api/user/me`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.user).toBeDefined();
    expect(data.user.aiCredits).toBeGreaterThanOrEqual(40);
  });

  it('5. GET /api/video/:id untuk video contoh harus mengembalikan metrik & Skor Kanalisa valid', async () => {
    const res = await fetch(`${baseUrl}/api/video/dQw4w9WgXcQ?includeScore=true&includeChannel=true`);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.video).toBeDefined();
    expect(data.video.id).toBe('dQw4w9WgXcQ');
    expect(data.video.viewCount).toBe(125000);
    expect(data.video.likeCount).toBe(5200);
    expect(data.score).toBeDefined();
    expect(data.score.total).toBeGreaterThan(0);
    expect(data.score.total).toBeLessThanOrEqual(100);
    expect(data.isMock).toBe(true);
  });

  it('6. GET /api/video/:id untuk video sembarang harus menghasilkan data deterministik (tidak 404)', async () => {
    const res = await fetch(`${baseUrl}/api/video/arbitraryVid123?includeScore=true`);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.video).toBeDefined();
    expect(data.video.viewCount).toBeGreaterThan(0);
    expect(data.score.total).toBeGreaterThanOrEqual(0);
  });

  it('7. POST /api/video/batch harus menerima array video ID', async () => {
    const res = await fetch(`${baseUrl}/api/video/batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: ['dQw4w9WgXcQ', 'abc123def456'] }),
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data.videos)).toBe(true);
    expect(data.videos.length).toBe(2);
  });

  it('8. GET /api/keyword/search harus mengembalikan riset kata kunci & peluang', async () => {
    const res = await fetch(`${baseUrl}/api/keyword/search?q=ayam%20geprek`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.query).toBe('ayam geprek');
    expect(data.volumeRelative).toBeGreaterThan(0);
    expect(data.competition).toBeGreaterThan(0);
    expect(data.opportunityScore).toBeDefined();
    expect(data.label).toBeDefined();
    expect(Array.isArray(data.relatedKeywords)).toBe(true);
    expect(data.relatedKeywords.length).toBeGreaterThan(0);
  });

  it('9. POST /api/ai/suggest-title harus menghasilkan rekomendasi judul berbahasa Indonesia', async () => {
    const res = await fetch(`${baseUrl}/api/ai/suggest-title`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        topic: 'ayam geprek sambal matah',
        niche: 'kuliner',
        style: 'casual',
        count: 5,
      }),
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data.titles)).toBe(true);
    expect(data.titles.length).toBe(5);
    expect(data.creditsUsed).toBe(1);
  });

  it('10. GET /api/ai/credits harus mengembalikan status kredit AI', async () => {
    const res = await fetch(`${baseUrl}/api/ai/credits`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.limit).toBe(50);
    expect(data.remaining).toBeLessThanOrEqual(50);
  });

  it('11. GET /api/billing/plans & /subscription harus mengembalikan data yang valid', async () => {
    const plansRes = await fetch(`${baseUrl}/api/billing/plans`);
    expect(plansRes.status).toBe(200);
    const plans = await plansRes.json();
    expect(plans.plans.pro).toBeDefined();

    const subRes = await fetch(`${baseUrl}/api/billing/subscription`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    expect(subRes.status).toBe(200);
    const sub = await subRes.json();
    expect(sub.tier).toBe('free');
  });

  it('12. Syntax JSON invalid pada request body harus ditolak dengan HTTP 400 (bukan 500)', async () => {
    const res = await fetch(`${baseUrl}/api/ai/suggest-title`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: '{"invalid_json": true, broken',
    });
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain('JSON');
  });

  it('13. Route yang tidak ada harus merespon dengan HTTP 404', async () => {
    const res = await fetch(`${baseUrl}/api/route-yang-tidak-ada`);
    expect(res.status).toBe(404);
  });
});
