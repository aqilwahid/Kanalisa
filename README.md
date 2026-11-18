# Kanalisa — Ekstensi Chrome Analitik & SEO YouTube Berbahasa Indonesia

![Kanalisa Logo](./Kanalisa%20logo.png)

## 📌 Ringkasan

**Kanalisa** adalah ekstensi Google Chrome (Manifest V3) yang memberikan wawasan analitik dan rekomendasi SEO langsung di halaman YouTube, dirancang khusus untuk kreator dan pengelola kanal YouTube Indonesia.

### ✨ Fitur Utama (MVP v1.0)

- 📊 **Overlay Panel Video (`/watch`)** — Skor Kanalisa (0–100), metrik video (tayangan, TPJ rata-rata sejak publikasi, suka, komentar, tingkat interaksi, umur video), analisis tag dengan tombol salin, checklist SEO 7 butir, dan indikator video meledak (*outlier*).
- **Beranda YouTube** menampilkan rata-rata tayangan per jam (TPJ/VPH) pada kartu video, dengan logo Kanalisa.
- **YouTube Studio** menampilkan skor SEO metadata (0–100) dan tujuh pemeriksaan saat judul, deskripsi, atau tag diedit.
- 🔍 **Riset Kata Kunci (`/results`)** — Kartu analisis kata kunci di atas hasil pencarian YouTube: volume pencarian relatif, tingkat persaingan, skor peluang kata kunci, dan daftar kata kunci terkait.
- 💡 **Rekomendasi AI** — Pembuatan ide judul video dalam 4 gaya bahasa Indonesia (Formal, Santai, Clickbait Ringan, Edukatif), rekomendasi deskripsi terstruktur dengan timestamp & hashtag, serta rekomendasi tag.
- 🔐 **Autentikasi Pengguna** — Login menggunakan Google OAuth dengan dukungan *1-Click Mock Dev Login* untuk pengujian lokal instan tanpa konfigurasi Google Cloud Console.
- 💳 **Paket & Batas Penggunaan** — Paket Gratis (3 riset kata kunci/hari, 50 kredit AI/bulan) dan Pro (kuota kata kunci tak terbatas, 1.500 kredit AI/bulan).
- 🌍 **Lokalisasi Penuh** — Seluruh antarmuka, istilah analitik baku (TPJ, Tayangan, Interaksi), saran AI, dan format mata uang/tanggal diformat dalam Bahasa Indonesia (WIB/WITA/WIT).

---

## 🏗️ Struktur Proyek

```
Kanalisa/
├── src/                          ← Folder Ekstensi Chrome (Folder untuk 'Load unpacked')
│   ├── manifest.json             ← Manifest V3 (permissions, content scripts, background)
│   ├── icons/                    ← Ikon ekstensi rasio 1:1 (16, 32, 48, 128 px)
│   ├── background/
│   │   └── service-worker.js     ← Background worker (komunikasi API & alarm reset kuota)
│   ├── content/
│   │   ├── index.js              ← Deteksi navigasi SPA YouTube & mounting
│   │   ├── adapter.js            ← Abstraksi selector DOM YouTube & Shadow DOM
│   │   └── pages/
│   │       ├── watch.js          ← Panel overlay analitik di halaman video
│   │       └── results.js        ← Kartu riset kata kunci di halaman pencarian
│   ├── popup/                    ← Jendela popup ekstensi di toolbar browser
│   ├── options/                  ← Halaman onboarding & pengaturan preferensi
│   ├── utils/
│   │   ├── api.js                ← Klien API terpusat (deteksi otomatis dev/prod)
│   │   ├── format.js             ← Format angka lokal (1,2 rb, 3,4 jt), Rp, tanggal
│   │   ├── scoring.js            ← Formula Skor Kanalisa & Peluang Kata Kunci
│   │   └── cache.js              ← Penyimpanan cache lokal dengan TTL
│   └── _locales/
│       ├── id/messages.json      ← Bahasa Indonesia (utama)
│       └── en/messages.json      ← English fallback
│
├── backend/                      ← API Server (Node.js + Express)
│   ├── package.json
│   ├── .env.example              ← Contoh variabel environment
│   ├── src/
│   │   ├── index.js              ← Entry point server Express & konfigurasi CORS
│   │   ├── config.js             ← Validasi environment Zod & status mode layanan
│   │   ├── store.js              ← Abstraksi storage (In-memory dev & Redis/Postgres)
│   │   ├── routes/               ← Endpoint API (video, keyword, ai, auth, billing, user)
│   │   ├── services/             ← Logika bisnis (YouTube, Scoring, Keyword, AI)
│   │   └── middleware/           ← Autentikasi JWT & pembatasan kuota
│   └── tests/                    ← Pengujian otomatis (scoring, video, keyword, integrasi)
│
├── docs/
│   └── LAPORAN-AUDIT.md          ← Laporan audit teknis & status kesiapan sistem
├── PRD-Kanalisa-Ekstensi-Chrome-YouTube.md
└── README.md
```

---

## 💻 Panduan Menjalankan di Windows (VS Code & Google Chrome)

Ikuti langkah-langkah di bawah ini untuk menjalankan dan menguji Kanalisa di komputer lokal Anda:

### Prasyarat
- **Node.js** versi 20.x atau lebih baru ([Download Node.js](https://nodejs.org/))
- **Google Chrome** browser
- **Visual Studio Code** (VS Code)

---

### Langkah 1: Jalankan Backend API Server

Backend Kanalisa bertindak sebagai penyedia data analitik dan logika AI.

1. Buka folder proyek **`Kanalisa`** di VS Code.
2. Buka terminal terintegrasi di VS Code (`Ctrl + \`` atau menu **Terminal** → **New Terminal**).
3. Jalankan perintah berikut:
   ```powershell
   cd backend
   npm install
   npm run dev
   ```
4. Pastikan terminal menampilkan pesan:
   ```
   🚀 Kanalisa API running on http://localhost:3000
      Environment: development
      Modes: YouTube=mock, Auth=mock, AI=mock, DB=memory, Cache=memory
   ```

> 💡 **Apakah perlu menjalankan dev server untuk frontend?**  
> **TIDAK PERLU.** Frontend Kanalisa adalah Ekstensi Chrome statis Manifest V3 di dalam folder `src/`. Ekstensi dimuat langsung ke browser tanpa perlu `npm run dev` atau bundler frontend. Hanya backend yang perlu dijalankan.

> 💡 **Bagaimana cara mengaktifkan Mode Mock?**  
> **Mode Mock aktif secara otomatis.** Jika file `.env` tidak diisi dengan API key (atau tidak ada file `.env`), backend langsung beroperasi menggunakan data tiruan (*mock*) deterministik dan penyimpanan in-memory. Anda tidak perlu membuat akun Google Cloud Console, Redis, atau PostgreSQL untuk pengujian lokal.

---

### Langkah 2: Pasang Ekstensi di Google Chrome

1. Buka browser **Google Chrome**.
2. Buka halaman ekstensi dengan mengetikkan:
   ```
   chrome://extensions/
   ```
3. Aktifkan **Developer mode** melalui tombol sakelar di pojok kanan atas.
4. Klik tombol **Load unpacked** di pojok kiri atas.
5. Pada jendela pemilihan folder, arahkan ke folder proyek Kanalisa dan pilih folder:
   ```
   C:\Users\<Username>\...\Kanalisa\src
   ```
   *(PENTING: Pilih folder **`src`**, BUKAN root folder `Kanalisa` dan bukan folder `backend`)*.
6. Ekstensi **Kanalisa** akan muncul di daftar ekstensi dengan logo persegi biru-navy resmi.
7. Sematkan (*pin*) ikon Kanalisa di toolbar Chrome agar mudah diakses.

---

### Langkah 3: Verifikasi dan Pengujian Fitur

#### A. Uji Coba Overlay Video (`/watch`)
1. Buka video YouTube apa saja di Chrome (contoh: `https://www.youtube.com/watch?v=dQw4w9WgXcQ` atau video lainnya).
2. Perhatikan kolom samping kanan (di atas daftar video rekomendasi):
   - **Panel Kanalisa** akan muncul dengan status memuat lalu menampilkan data analitik.
   - Periksa metrik: **Skor Kanalisa** (0–100), **Tayangan per Jam (TPJ)**, **Tayangan**, **Suka**, **Komentar**, **Tingkat Interaksi**, dan **Umur Video**.
   - Klik tab **Tag**: periksa daftar tag dan coba tombol **Salin semua**.
   - Klik tab **SEO**: periksa checklist optimasi metadata (panjang judul, deskripsi, hashtag, timestamp, tautan).
   - Klik tombol **−** di header panel untuk menguji fitur ciutkan (*collapse*).

#### B. Uji Coba Riset Kata Kunci Pencarian (`/results`)
1. Lakukan pencarian di YouTube, misalnya ketik: `ayam geprek` atau `capcut`.
2. Di bagian paling atas hasil pencarian, **Kartu Riset Kata Kunci** Kanalisa akan muncul.
3. Periksa informasi:
   - Volume Pencarian Relatif (0–100)
   - Tingkat Persaingan (0–100)
   - Skor Peluang Kata Kunci (dengan lencana: Peluang Tinggi / Sedang / Rendah)
   - Chip kata kunci terkait (klik salah satu chip untuk langsung mencari kata kunci tersebut).

#### C. Uji Coba Popup & Login Mock
1. Klik ikon ekstensi **Kanalisa** di toolbar Chrome.
2. Jendela popup akan terbuka:
   - Status awal: "Belum masuk".
   - Klik tombol **"Masuk dengan Google"**.
   - Dalam mode development/mock, login langsung berhasil secara instan dan status berubah menjadi: `"Terkoneksi sebagai test@example.com"`.
   - Informasi sisa Kredit AI (50) dan Kuota Kata Kunci (3) akan tampil.
3. Ketik kata kunci lalu tekan Enter. Popup menampilkan volume relatif, persaingan, skor peluang, dan kata kunci terkait. Klik **Cari di YouTube** jika ingin membuka hasil video.

#### D. Uji Coba Halaman Pengaturan & Onboarding
1. Pada popup, klik tombol **"Buka pengaturan"** (atau klik kanan ikon ekstensi → **Options**).
2. Tab **Siapkan Kanalisa** akan terbuka:
   - Langkah 1: Pilih niche kanal (Kuliner, Teknologi, Gaming, dll.).
   - Langkah 2: Pilih zona waktu (WIB/WITA/WIT) dan gaya bahasa AI (Santai, Formal, Clickbait Ringan, Edukatif).
   - Langkah 3: Tinjau dan simpan.
3. Tab **Pengaturan**:
   - Pengaturan **Metrik video di YouTube dan skor SEO di Studio** mengontrol TPJ di beranda, panel video, dan skor di Studio. Kartu pencarian punya pengaturan terpisah.
   - Pilihan tema: Ikuti Sistem, Terang, Gelap.
   - Konfigurasi URL server backend (otomatis `http://localhost:3000`).

#### E. Uji Coba TPJ Beranda dan Skor SEO Studio

1. Setelah memuat ulang ekstensi, buka beranda YouTube yang menampilkan rekomendasi video. TPJ muncul di bawah metadata kartu. Backend mock memberi label **Data contoh** pada metrik.
2. Di YouTube Studio, buka langkah **Detail** pada dialog unggah atau buka detail video yang sudah ada. Panel **Skor SEO Kanalisa** muncul di bawah judul. Ubah judul atau deskripsi dan buka **Pemeriksaan SEO** untuk melihat pengaruhnya.
3. Tampilkan kolom **Tag** agar pemeriksaan tag ikut dihitung. Ekstensi menilai draf di browser tanpa mengirim metadata ke backend atau mengubah isian YouTube Studio.

---

### Langkah 4: Cara Memeriksa Log & Menangani Error

Jika terjadi kendala saat pengujian:

1. **Memeriksa Backend:**
   - Lihat output di terminal VS Code tempat `npm run dev` berjalan.
   - Pastikan endpoint health check merespon dengan benar:
     ```powershell
     curl.exe http://localhost:3000/health
     ```
2. **Memeriksa Service Worker Ekstensi:**
   - Buka `chrome://extensions/`.
   - Pada kartu ekstensi Kanalisa, klik tautan bertuliskan **"service worker"** (berwarna biru).
   - Console DevTools untuk background script akan terbuka untuk memeriksa network request dan log perpesanan.
3. **Memeriksa Content Script (Halaman YouTube):**
   - Pada halaman YouTube tempat panel muncul, tekan tombol **F12** atau klik kanan → **Inspect**.
   - Buka tab **Console** dan filter dengan kata kunci `Kanalisa` untuk melihat log rendering.
4. **Memperbarui Ekstensi Setelah Mengubah Kode:**
   - Jika Anda mengubah kode di folder `src/`, buka `chrome://extensions/` lalu klik ikon panah melingkar (**Reload**) pada kartu Kanalisa.

---

## 🧪 Pengujian Otomatis (Automated Testing)

Repositori dilengkapi dengan pengujian unit dan pengujian integrasi otomatis:

```powershell
# Jalankan seluruh test suite backend (64 tes)
cd backend
npm test

# Jalankan self-check logika format & scoring ekstensi
cd ../src
node utils/self-check.js
```

Jalankan tes Playwright dari folder `backend`. Port `3000` harus kosong agar tes bisa memulai backend mock sendiri. Suite memuat ekstensi MV3 di Chromium dan memakai fixture untuk halaman YouTube serta formulir unggah dan edit di Studio.

```powershell
cd backend
npm ci
npx playwright install chromium --no-shell
npm run test:e2e
```

Untuk mengecek selector pada YouTube langsung, jalankan smoke test berikut. Backend tetap memakai data mock.

```powershell
$env:KANALISA_YOUTUBE_LIVE = '1'
npm run test:e2e -- --grep 'live YouTube'
Remove-Item Env:KANALISA_YOUTUBE_LIVE
```

---

## 🔐 Konfigurasi Environment (Production / Live API)

Untuk beralih dari mode mock ke mode data asli, buat file `.env` di folder `backend/` dan isi kredensial berikut:

```env
PORT=3000
NODE_ENV=development

# Kredensial YouTube Data API v3 (Google Cloud Console)
YOUTUBE_API_KEY=AIzaSy...

# Google OAuth 2.0 (Web Application)
GOOGLE_CLIENT_ID=...apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-...

# Secret Token JWT (minimal 32 karakter)
JWT_SECRET=rahasia-jwt-produksi-minimal-32-karakter-panjangnya

# Database & Cache (Production)
DATABASE_URL=postgresql://user:password@localhost:5432/kanalisa
REDIS_URL=redis://localhost:6379

# Kredensial OpenAI / LLM Provider
LLM_API_KEY=sk-...
LLM_MODEL=gpt-4o-mini
```

---

## 📄 Dokumentasi Terkait

- [Laporan Audit Teknis & Status Kesiapan](./docs/LAPORAN-AUDIT.md)
- [Product Requirements Document (PRD)](./PRD-Kanalisa-Ekstensi-Chrome-YouTube.md)
- [Workflow & Aturan Pengembangan](./AGENTS.md)
