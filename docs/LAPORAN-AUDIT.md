# Laporan Audit Teknis, Perbaikan, dan Status Kesiapan Kanalisa

**Tanggal Audit:** 15 November 2026  
**Auditor:** AI Assistant (Copilot SDK in VS Code)  
**Status Target:** MVP Development & Local Testing Stabil

---

## 1. Ringkasan Eksekutif

Audit teknis mendalam telah dilakukan terhadap seluruh repositori proyek **Kanalisa** (Frontend Chrome Extension MV3 dan Backend Express API). Audit menemukan sejumlah anomali kritis yang sebelumnya menyebabkan kegagalan fungsional pada tahap local testing (misalnya: panel menampilkan angka 0, komunikasi API gagal akibat CORS dan mismatch port/domain, data mock tidak terhubung ke halaman pencarian, dan kegagalan token refresh).

Seluruh anomali tersebut telah diperbaiki, diuji, dan diverifikasi dengan suite pengujian otomatis (**64 tes unit & integrasi lulus 100%**). Kanalisa kini berada dalam kondisi **siap diuji secara lokal (Local Testing Ready)** menggunakan data tiruan (mock) deterministik tanpa memerlukan API key eksternal, Redis lokal, maupun PostgreSQL lokal.

---

## 2. Masalah yang Ditemukan dan Solusi Perbaikan

### 2.1 Komunikasi Ekstensi & Backend (Environment Config)
* **Temuan:** `src/background/service-worker.js` memanggil `https://api.kanalisa.id`, sedangkan `src/utils/api.js` memanggil `http://localhost:3000`. Akibatnya, pemanggilan dari content script gagal total saat diuji lokal.
* **Perbaikan:** Dibuat fungsi penentu environment otomatis `getApiBase()` di `src/utils/api.js`. Jika ekstensi dipasang melalui mode *Load unpacked* (tidak memiliki atribut `update_url` di manifest), URL otomatis diarahkan ke `http://localhost:3000`. Jika dipasang dari Chrome Web Store, otomatis ke `https://api.kanalisa.id`. Opsi override manual juga disediakan pada halaman Pengaturan. `service-worker.js` diselaraskan menggunakan `importScripts('../utils/api.js')` untuk menghilangkan duplikasi kode.

### 2.2 Rasio Aspek Ikon Ekstensi
* **Temuan:** File logo horizontal (2172×724 px, ~441 KB) sebelumnya disalin langsung sebagai ikon 16, 32, 48, dan 128 px, menyebabkan tampilan ikon pada toolbar Chrome terdistorsi (gepeng) dan memperberat ukuran bundle.
* **Perbaikan:** Simbol grafis logo Kanalisa dipotong secara presisi dengan rasio 1:1 dan di-render ulang dengan interpolasi kualitas tinggi menjadi file PNG persegi (16×16, 32×32, 48×48, 128×128 px) dengan ukuran ringan (0,6 KB – 11,8 KB).

### 2.3 Normalisasi Data Mock Video & Channel
* **Temuan Kritis:** Data di `youtube-mock.js` memiliki struktur *flat* (`viewCount`, `likeCount`), sementara fungsi `normalizeVideo` dan `normalizeChannel` di `services/youtube.js` mengekstrak data dari `statistics.viewCount` dan `snippet.title`. Akibatnya, tayangan, suka, dan komentar selalu bernilai `0`, dan Skor Kanalisa anjlok ke nilai `2`.
* **Perbaikan:** `normalizeVideo` dan `normalizeChannel` diperbarui agar mendukung baik struktur bersarang YouTube Data API v3 maupun objek data tiruan. Selain itu, `youtube-mock.js` kini menghasilkan data video deterministik untuk video ID apa pun yang dibuka di YouTube.

### 2.4 Keamanan & CORS Chrome Extension
* **Temuan:** Konfigurasi CORS backend sebelumnya hanya mengizinkan `config.FRONTEND_URL` (`localhost:5173`). Ketika ekstensi memanggil API, browser mengirimkan header `Origin: chrome-extension://<id>` yang langsung ditolak oleh backend.
* **Perbaikan:** Middleware CORS di `backend/src/index.js` diperbarui agar secara dinamis mengizinkan origin berformat `chrome-extension://` dan `localhost` pada mode development, serta daftar origin terverifikasi pada mode production.

### 2.5 Metrik TPJ (Tayangan per Jam) dan Skor Kanalisa
* **Temuan:** Nilai TPJ dihitung dari `tayangan / jam sejak publikasi`, namun sebelumnya dilabeli ambigu seolah-olah merupakan kecepatan tayangan real-time saat ini.
* **Perbaikan:** Metrik diperjelas sebagai rata-rata tayangan per jam sejak video dipublikasikan (`vphMethod: 'average_since_publish'`). Tooltip dan label diselaraskan dengan glosarium PRD §17 agar tidak menyesatkan pengguna.

### 2.6 Determinisme Riset Kata Kunci
* **Temuan:** Fungsi `calculateVolumeRelative` menggunakan `Math.random()`, sehingga kata kunci yang sama menghasilkan skor peluang yang berubah-ubah pada setiap pencarian.
* **Perbaikan:** `Math.random()` dihapus dan digantikan dengan algoritma hashing string deterministik. Hasil pencarian kini konsisten dan dapat direproduksi.

### 2.7 Integrasi Kartu Pencarian (`results.js`)
* **Temuan:** Kartu riset kata kunci di halaman pencarian YouTube hanya membaca kamus lokal hardcoded. Jika kata kunci tidak ada di daftar, kartu menampilkan pesan kosong.
* **Perbaikan:** `src/content/pages/results.js` kini memanggil endpoint backend `/api/keyword/search?q=...` melalui service worker, dengan fallback anggun ke data contoh lokal jika server backend sedang tidak aktif.

### 2.8 Perbaikan Endpoint Subscription & Webhook
* **Temuan:** `backend/src/routes/billing.js` memanggil `req.db.getUserById` yang menyebabkan error 500 karena objek database terpasang sebagai `req.userModel`. Webhook juga menggunakan perbandingan string biasa yang rentan terhadap timing attacks.
* **Perbaikan:** Seluruh pemanggilan diselaraskan ke `req.userModel`, dan verifikasi signature webhook diperkuat dengan `crypto.timingSafeEqual`.

---

## 3. Matriks Status Fitur Berdasarkan Tahap Kesiapan

| Fitur | Status Kesiapan | Mode Data Saat Ini | Catatan & Kebutuhan Lanjutan |
|---|---|---|---|
| **Ikon & Identitas Ekstensi** | Production Ready | Aset Lokal | Ikon persegi 1:1 (16, 32, 48, 128 px) sudah sesuai standar Web Store. |
| **Overlay Panel Video (`/watch`)** | Local Testing Ready | Mock / Deterministik | Tampil stabil pada navigasi SPA YouTube, metrik lengkap, checklist SEO 7 butir, panel dapat diciutkan. |
| **Kartu Kata Kunci (`/results`)** | Local Testing Ready | Mock / Deterministik | Terhubung ke backend `/api/keyword/search`, volume relatif, persaingan, skor peluang. |
| **Popup Ekstensi** | Local Testing Ready | Terhubung ke Backend | Status koneksi, kuota kata kunci, kredit AI, riset cepat via input pencarian. |
| **Opsi & Onboarding** | Local Testing Ready | Storage Sync & Local | Wizard 3 langkah, preferensi niche, zona waktu, gaya AI, konfigurasi URL API. |
| **Autentikasi Dev / Mock** | Local Testing Ready | Mock (JWT lokal) | 1-klik login akun uji coba (`test@example.com`) tanpa Google Cloud Console. |
| **Google OAuth Asli** | Development / Staging Ready | Kode Siap, Perlu Kredensial | Kode penukaran auth code sudah siap; membutuhkan `GOOGLE_CLIENT_ID` & `SECRET` asli. |
| **YouTube Data API v3 Asli** | Development / Staging Ready | Kode Siap, Perlu Kredensial | Kuota tracker & batching 50 ID sudah siap; membutuhkan `YOUTUBE_API_KEY` aktif & audit kuota. |
| **Rekomendasi AI (LLM)** | Local Testing Ready (Mock) | Mock Templates | 4 gaya bahasa Indonesia (Formal, Santai, Clickbait Ringan, Edukatif) berfungsi. Live mode siap via `LLM_API_KEY`. |
| **Sistem Kuota & Rate Limiting** | Local Testing Ready | In-Memory KV (Dev) | Pembatasan Gratis (3 kata kunci/hari, 50 kredit AI) dan Pro (unlimited) aktif. Siap Redis di prod. |
| **Model Pengguna & Penyimpanan** | Local Testing Ready | In-Memory Store (Dev) | Siap PostgreSQL via `DATABASE_URL` untuk staging/production. |
| **Billing & Langganan** | Scaffolding / Local Testing | Mock / Webhook Stub | Struktur plan Gratis/Pro/Agensi, perhitungan Rupiah, dan verifikasi webhook siap dihubungkan ke Midtrans/Xendit. |

---

## 4. Evaluasi Keamanan

1. **Penyimpanan Kredensial:**
   - Tidak ada API key, token rahasia, atau kredensial database yang di-hardcode ke dalam kode sumber ekstensi maupun backend.
   - File `.env` sudah masuk ke `.gitignore` dan diverifikasi tidak pernah ter-commit ke riwayat Git.
2. **Perlindungan Endpoint & Validasi Input:**
   - Parameter video ID divalidasi dengan regex alfanumerik untuk mencegah injection.
   - Input JSON yang cacat ditangani oleh middleware khusus dengan HTTP 400 Bad Request tanpa membocorkan stack trace internal.
   - Perbandingan tanda tangan webhook pembayaran menggunakan `crypto.timingSafeEqual` untuk mencegah *timing attacks*.
3. **CORS:**
   - Diatur secara dinamis agar hanya menerima origin ekstensi Chrome terdaftar dan domain frontend resmi.
4. **Kepatuhan Privasi (UU PDP & Kebijakan Chrome Web Store):**
   - Ekstensi tidak meminta izin berbahaya seperti `<all_urls>`, `webRequest`, atau `tabs`.
   - Disediakan endpoint `DELETE /api/auth/account` untuk memenuhi hak penghapusan data pengguna.

---

## 5. Ringkasan Verifikasi & Pengujian

Suite pengujian dijalankan dan diverifikasi melalui command line:
- **Unit & Integrasi Backend:** 64 tes lulus (`vitest run`)
  - `tests/scoring.test.js`: 26 tes lulus
  - `tests/keyword.test.js`: 13 tes lulus
  - `tests/video.test.js`: 12 tes lulus
  - `tests/integration.test.js`: 13 tes lulus (mencakup health, auth, video, keyword, AI, billing, dan penanganan error)
- **Self-Check Ekstensi:** Lulus 100% (`node src/utils/self-check.js`)
- **Pengujian Manual (Curl & HTTP Probes):**
  - Endpoint `/health`, `/api/video/dQw4w9WgXcQ`, `/api/video/arbitraryId`, `/api/auth/google`, `/api/keyword/search`, dan `/api/ai/suggest-title` terverifikasi merespon dengan format JSON yang tepat dan status code yang sesuai.
