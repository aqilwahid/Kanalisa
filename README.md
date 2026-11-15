# Kanalisa — Ekstensi Chrome Analitik & SEO YouTube Berbahasa Indonesia

![Kanalisa Logo](./Kanalisa%20logo.png)

## 📌 Ringkasan

**Kanalisa** adalah ekstensi Chrome (Manifest V3) yang memberikan insight analitik dan rekomendasi SEO langsung di halaman YouTube, dirancang khusus untuk kreator dan pengelola kanal YouTube Indonesia.

### ✨ Fitur Utama (MVP v1.0)

- 📊 **Overlay Panel Video** — Skor Kanalisa (0-100), metrik video real-time (views, TPJ, likes, comments, engagement rate), analisis tag, checklist SEO
- 🔍 **Riset Keyword** — Volume relatif, persaingan, skor peluang dengan label (Tinggi/Sedang/Rendah) di halaman hasil pencarian YouTube
- 💡 **Saran AI** — Saran judul video dalam 4 gaya (formal, santai, clickbait-ringan, edukatif) berbahasa Indonesia natural
- 🔐 **Login Google** — Autentikasi via Google OAuth, tier-based (Gratis/Pro)
- 💳 **Paket Berlangganan** — Gratis (terbatas), Pro (unlimited) dengan opsi pembayaran QRIS/e-wallet Indonesia
- 🌍 **Lokalisasi Penuh** — UI, saran AI, format angka/tanggal/mata uang dalam bahasa Indonesia sesuai zona waktu WIB/WITA/WIT

---

## 🏗️ Arsitektur

```
Kanalisa/
├── src/                          (Chrome Extension - MV3)
│   ├── manifest.json             (MV3 config, permissions, i18n)
│   ├── background/               (Service Worker)
│   │   └── service-worker.js     (Event listeners, alarm reset kuota)
│   ├── content/                  (Content Scripts)
│   │   ├── index.js              (SPA detection, routing)
│   │   ├── adapter.js            (DOM selector abstraction layer)
│   │   └── pages/
│   │       ├── watch.js          (Video page overlay panel)
│   │       └── results.js        (Search results keyword card)
│   ├── popup/                    (Extension popup)
│   │   ├── popup.html
│   │   ├── popup.js
│   │   └── popup.css
│   ├── options/                  (Settings & onboarding)
│   │   ├── options.html
│   │   ├── options.js
│   │   └── options.css
│   ├── utils/                    (Utilities)
│   │   ├── api.js                (Backend API wrapper)
│   │   ├── format.js             (Format angka, mata uang, tanggal Indonesia)
│   │   ├── scoring.js            (Skor Kanalisa & Peluang Keyword formula)
│   │   ├── cache.js              (chrome.storage wrapper dengan TTL)
│   │   └── mock-data.js          (Mock data untuk testing)
│   ├── styles/                   (CSS)
│   │   ├── base.css
│   │   ├── panel.css
│   │   └── popup.css
│   ├── _locales/                 (Lokalisasi i18n)
│   │   ├── id/messages.json      (Bahasa Indonesia - 71 string)
│   │   └── en/messages.json      (English fallback)
│
├── backend/                      (Node.js + Express API)
│   ├── package.json
│   ├── .env.example
│   ├── src/
│   │   ├── index.js              (Express server)
│   │   ├── config.js             (Env validation)
│   │   ├── middleware/
│   │   │   ├── auth.js           (JWT verification)
│   │   │   └── rateLimit.js      (Per-tier rate limiting)
│   │   ├── routes/
│   │   │   ├── video.js          (GET /api/video/:id)
│   │   │   ├── keyword.js        (GET /api/keyword/search)
│   │   │   ├── ai.js             (POST /api/ai/suggest-*)
│   │   │   ├── auth.js           (POST /api/auth/google)
│   │   │   ├── billing.js        (POST /api/billing/webhook)
│   │   │   └── user.js           (GET /api/user/me)
│   │   ├── services/
│   │   │   ├── youtube.js        (YouTube Data API v3 wrapper)
│   │   │   ├── keyword.js        (Keyword scoring service)
│   │   │   ├── ai.js             (LLM integration)
│   │   │   ├── youtube-mock.js   (Mock YouTube API for testing)
│   │   │   └── keyword-mock.js   (Mock keyword data for testing)
│   │   ├── models/
│   │   │   ├── user.js           (User schema & queries)
│   │   │   └── keyword-cache.js  (Keyword cache schema)
│   │   ├── utils/
│   │   │   ├── cache.js          (Redis wrapper)
│   │   │   ├── format.js         (Server-side formatting)
│   │   │   └── quota.js          (YouTube API quota tracking)
│   │   └── tests/
│   │       ├── video.test.js
│   │       ├── keyword.test.js
│   │       └── scoring.test.js
│
├── PRD-Kanalisa-Ekstensi-Chrome-YouTube.md  (Product Requirements Document)
├── README.md                     (This file)
├── AGENTS.md                     (Development workflow & coordination)
└── .gitignore
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js >= 20.0
- npm >= 10.0
- Chrome/Chromium browser
- PostgreSQL 14+ (untuk production)
- Redis (untuk production)

### Setup Development

#### 1. Backend API (Development)

```bash
cd backend
npm install

# Setup .env (copy dari .env.example)
cp .env.example .env
# Edit .env dengan credentials lokal

# Jalankan dalam mode development (mock data)
npm run dev
# Server akan start di http://localhost:3000
# Health check: curl http://localhost:3000/health
```

#### 2. Extension di Chrome (Development)

1. **Buka Chrome** → ketik `chrome://extensions`
2. **Toggle** "Developer mode" (kanan atas)
3. **Click** "Load unpacked"
4. **Select** folder `src/` dari project Kanalisa
5. **Extension akan muncul** di toolbar Chrome

#### 3. Testing

- Buka halaman video YouTube (contoh: `youtube.com/watch?v=...`)
- **Panel Kanalisa** akan muncul di samping kanan (daftar rekomendasi)
- Lihat Skor Kanalisa, metrik, tag, checklist SEO dengan **mock data**
- Buka halaman search YouTube → **kartu keyword** muncul di atas hasil

---

## 📊 Metrik Skor

### Skor Kanalisa (0-100)

| Komponen | Bobot | Definisi |
|---|---|---|
| **Kecepatan (VPH)** | 35% | Views per hour relatif terhadap median kanal |
| **Engagement** | 25% | (Likes + Comments) / Views dibanding kategori |
| **Kekuatan SEO** | 20% | Checklist: panjang judul, deskripsi, tag, link, timestamp, hashtag |
| **Relevansi Keyword** | 20% | Cosine similarity judul vs tag + deskripsi |

### Skor Peluang Keyword (0-100)

```
Peluang = Volume Relatif × (100 - Persaingan) / 100
```

- **Label:** `≥70 Tinggi` | `40-69 Sedang` | `<40 Rendah`
- **Volume:** Google Trends (kategori YouTube Search, geo=ID) + internal data
- **Persaingan:** Median views top 20 results + proporsi judul dengan keyword exact match

---

## 🔧 API Endpoints (Backend)

### Public Endpoints (Mock Data)

```
GET  /health                          → Server status
GET  /api/video/:id                   → Video stats + Skor Kanalisa
GET  /api/keyword/search?q=...        → Keyword opportunities
GET  /api/keyword/related?q=...       → Related keywords
```

### Authenticated Endpoints (require JWT)

```
POST /api/auth/google                 → Login (Google OAuth)
GET  /api/user/me                     → Current user profile
POST /api/ai/suggest-title            → Saran judul (5 opsi, 4 gaya)
POST /api/ai/suggest-description      → Saran deskripsi
POST /api/ai/suggest-tags             → Saran tag
```

---

## 📱 Format Data Indonesia

### Angka
- `1200` → `1,2 rb`
- `3400000` → `3,4 jt`
- `125000000` → `125 jt`

### Mata Uang
- `49000` → `Rp49.000`
- `399000` → `Rp399.000`

### Tanggal (Zona WIB)
- `2026-11-15T10:00:00Z` → `15 Nov 2026`

### Istilah Baku (§17 PRD)
- Views → **Tayangan**
- Views per hour → **Tayangan per Jam (TPJ)**
- Engagement rate → **Tingkat Interaksi**
- Search volume → **Volume Pencarian (Relatif)**
- Competition → **Persaingan**
- Tags → **Tag**
- Credits → **Kredit AI**

---

## 🧪 Testing

### Mock Data Mode (No Credentials)

```bash
# Backend sudah serve mock data dari services/youtube-mock.js
npm run dev

# Di extension, panel akan menampilkan:
# - Video: "Cara membuat ayam geprek sambal matah yang enak"
#   Views: 125.000, TPJ: 2.604, Skor: 64, Engagement: 6.4%
# - Keyword: "ayam geprek" (Volume: 78, Persaingan: 64, Peluang: 28 - Rendah)
```

### Unit Tests

```bash
npm test                  # Jalankan semua test
npm run test:watch       # Watch mode
```

---

## 🔐 Environment Variables

### Backend (.env)

```bash
# Server
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# JWT
JWT_SECRET=your-secret-key-at-least-32-chars-long

# Database (production only)
DATABASE_URL=postgresql://user:pass@localhost:5432/kanalisa
REDIS_URL=redis://localhost:6379

# YouTube API (production)
YOUTUBE_API_KEY=sk-...

# Google OAuth (production)
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...

# LLM Provider (production)
OPENAI_API_KEY=sk-...
LLM_MODEL=gpt-4-turbo
```

---

## 🚢 Deployment

### Development → Production

1. **Setup Google Cloud Console**
   - Create project
   - Enable YouTube Data API v3
   - Create OAuth 2.0 credentials (extension + web)
   - Request API quota expansion (audit required)

2. **Database Setup**
   ```bash
   # PostgreSQL
   createdb kanalisa
   psql kanalisa < backend/schema.sql
   ```

3. **Deploy Backend**
   - Cloud Run, Heroku, atau self-hosted
   - Set production environment variables
   - Setup Redis (cache)
   - Configure LLM provider credentials

4. **Submit Chrome Web Store**
   - Upload extension (src/)
   - Add screenshots, description
   - Request 1-2 weeks untuk review

---

## 📝 Glosarium

| English | Kanalisa | Catatan |
|---|---|---|
| Views | Tayangan | |
| Views per hour (VPH) | Tayangan per Jam (TPJ) | "Kecepatan video mendapat tayangan saat ini" |
| Subscribers | Subscriber | Dipertahankan (lebih dikenal) |
| Engagement rate | Tingkat Interaksi | |
| Keyword | Kata kunci | |
| Search volume | Volume Pencarian (Relatif) | **Selalu dengan label "relatif"** |
| Competition | Persaingan | |
| Outlier | Video Meledak | Label: "3,2× rata-rata kanal" |
| Tags | Tag | |
| Credits | Kredit AI | Per saran = 1 kredit |

---

## 📊 Development Status

| Fase | Status | Fitur |
|---|---|---|
| **v1.0 (MVP)** | ✅ Complete | Overlay video, riset keyword, saran AI, login Google, paket Gratis/Pro |
| **v1.1** | 🔄 Planned | Studio integration, audit kanal, jam unggah optimal, pelacak kompetitor |
| **v2.0** | 📋 Backlog | Multi-kanal/agensi, ekspor PDF, saran thumbnail, bahasa Inggris, Edge support |

---

## 🤝 Contributing

Workflow development menggunakan 2 parallel agents (Agen 1: Frontend Extension, Agen 2: Backend API). Lihat [AGENTS.md](./AGENTS.md) untuk detail koordinasi.

---

## 📄 Lisensi

Internal project DPPP-RND. Dokumentasi & code © 2026.

---

## 📧 Support & Kontak

- **Email:** support@kanalisa.id (nanti)
- **Docs:** [PRD lengkap](./PRD-Kanalisa-Ekstensi-Chrome-YouTube.md)
- **Issues:** GitHub Issues

---

**Last Updated:** 15 November 2026  
**Versi:** 1.0 MVP (Pre-release)
