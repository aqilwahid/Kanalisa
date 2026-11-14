# PRD — Kanalisa: Ekstensi Chrome Analitik & SEO YouTube Berbahasa Indonesia

| Atribut | Nilai |
|---|---|
| Nama kerja | **Kanalisa** (sementara; lihat §16) |
| Jenis produk | Ekstensi Chrome (Manifest V3) + backend API + dashboard web ringan |
| Bahasa utama | Bahasa Indonesia (UI, konten AI, dokumentasi, dukungan) |
| Bahasa sekunder | Inggris (fase 2) |
| Pasar | Kreator & pengelola kanal YouTube Indonesia |
| Referensi fungsional | Kategori ekstensi "YouTube creator analytics" (mis. vidIQ Vision, TubeBuddy), hanya sebagai acuan kategori fitur; tidak menyalin kode, aset, merek, atau teks |
| Versi dokumen | 0.1 (draf) |
| Tanggal | 14 November 2026 |
| Pemilik | DPPP-RND |

---

## 1. Ringkasan

Kanalisa menampilkan data dan rekomendasi langsung di halaman YouTube dan YouTube Studio: skor video, metrik performa, tag, analisis kompetitor, dan saran judul/deskripsi berbasis AI. Kalkulasi keyword, tren, dan saran AI dioptimalkan untuk **bahasa dan perilaku penonton Indonesia**, termasuk campuran Indonesia–Inggris, bahasa gaul, dan zona waktu WIB/WITA/WIT.

**Proposisi nilai:** alat sejenis yang ada berbahasa Inggris, keyword dan sarannya bias ke pasar global, dan harganya dalam USD. Kanalisa memberi insight yang relevan secara lokal, harga dalam Rupiah, serta pembayaran QRIS/e-wallet.

---

## 2. Latar Belakang & Masalah

| # | Masalah | Dampak |
|---|---|---|
| P1 | UI dan istilah tools YouTube SEO berbahasa Inggris | Kreator pemula salah paham metrik, misalnya mengira VPH sama dengan total views |
| P2 | Saran keyword dan judul AI berbasis pola bahasa Inggris | Judul hasil terjemahan terasa kaku dan tidak cocok dengan gaya pencarian lokal |
| P3 | Estimasi pendapatan memakai CPM global | Ekspektasi kreator Indonesia meleset |
| P4 | Harga USD dan pembayaran wajib kartu kredit | Hambatan konversi ke versi berbayar |
| P5 | Rekomendasi jam unggah tidak memperhitungkan zona waktu Indonesia | Jadwal unggah tidak optimal |

---

## 3. Tujuan & Non-Tujuan

### 3.1 Tujuan

- **G1** — Menampilkan metrik inti video/kanal di halaman YouTube dalam ≤ 1,5 detik setelah halaman dimuat (p75).
- **G2** — Menyediakan riset keyword dan saran metadata (judul, deskripsi, tag) dalam Bahasa Indonesia yang natural.
- **G3** — Mengonversi ≥ 3% pengguna aktif gratis ke paket berbayar dalam 6 bulan setelah peluncuran.
- **G4** — Mematuhi kebijakan YouTube API Services, Chrome Web Store, dan UU PDP No. 27/2022.

### 3.2 Non-Tujuan (MVP)

- Bukan alat pengunggahan atau penjadwalan video.
- Tidak melakukan *scraping* data di luar API resmi atau DOM yang sedang ditampilkan ke pengguna.
- Tidak mendukung browser selain Chrome/Chromium (Edge, Brave) di MVP.
- Tidak menyediakan editor thumbnail/gambar (fase 2 dan opsional).
- Tidak menjanjikan peningkatan views atau ranking.

---

## 4. Persona

| Persona | Profil | Kebutuhan utama |
|---|---|---|
| **Rina — Kreator Pemula** | 0–1 rb subscriber, konten vlog/tutorial, belajar otodidak | Penjelasan metrik yang sederhana, ide judul, tag |
| **Bayu — Kreator Menengah** | 10 rb–100 rb subscriber, menuju monetisasi atau sudah monetisasi | Analisis kompetitor, keyword dengan peluang, jam unggah |
| **Sari — Pengelola Kanal Bisnis/Instansi** | Mengelola kanal UMKM, sekolah, atau lembaga pelatihan | Audit kanal, laporan ekspor, konsistensi SEO |
| **Agensi** | Mengelola 5–50 kanal | Multi-kanal, ekspor CSV, laporan berkala (fase 2) |

---

## 5. Ruang Lingkup per Fase

| Fase | Cakupan | Target |
|---|---|---|
| **MVP (v1.0)** | Overlay halaman video, panel hasil pencarian, popup, login Google, keyword dasar, saran judul AI, paket Gratis + Pro | Bulan ke-4 |
| **v1.1** | Integrasi YouTube Studio (skor SEO saat mengedit), audit kanal, jam unggah optimal, pelacak kompetitor | Bulan ke-6 |
| **v2.0** | Multi-kanal/agensi, ekspor laporan PDF, saran thumbnail (teks/analisis), bahasa Inggris, Edge Add-ons | Bulan ke-9 |

---

## 6. Kebutuhan Fungsional

Prioritas: **P0** = wajib MVP, **P1** = penting (v1.1), **P2** = nanti.
Ketersediaan: **G** = Gratis, **Pro** = berbayar.

### 6.1 Overlay Halaman Video (`youtube.com/watch`)

| ID | Kebutuhan | Prioritas | Paket | Kriteria penerimaan |
|---|---|---|---|---|
| F-VID-01 | Panel samping di atas daftar rekomendasi, dapat diciutkan | P0 | G | Panel muncul ≤ 1,5 dtk (p75), tidak menggeser pemutar video, status ciut/buka tersimpan |
| F-VID-02 | Metrik video: views, VPH (views per jam), like, komentar, rasio engagement, umur video | P0 | G | Angka diformat lokal (`1,2 rb`, `3,4 jt`), VPH dihitung dari `views / jam sejak publikasi` |
| F-VID-03 | **Skor Kanalisa** (0–100) dengan rincian komponen | P0 | G (skor), Pro (rincian) | Formula sesuai §7, tooltip menjelaskan arti tiap komponen dalam Bahasa Indonesia |
| F-VID-04 | Daftar tag video dengan tombol salin semua/per tag | P0 | G | Tag diambil dari `videos.list` (`snippet.tags`); jika kosong tampilkan "Video ini tidak memakai tag" |
| F-VID-05 | Analisis SEO judul & deskripsi: panjang, keyword utama, keberadaan tautan/timestamp/hashtag | P0 | G | Checklist hijau/kuning/merah, minimal 6 butir pemeriksaan |
| F-VID-06 | Statistik kanal pemilik video: subscriber, total video, rata-rata views 10 video terakhir | P1 | G | Data disimpan di cache ≤ 24 jam |
| F-VID-07 | Indikator "Outlier": video ini berapa kali rata-rata kanalnya | P1 | Pro | Label `3,2× rata-rata kanal` bila > 1,5× |
| F-VID-08 | Estimasi pendapatan dalam Rupiah (rentang) | P2 | Pro | Rentang RPM per kategori dapat dikonfigurasi admin; selalu diberi label "estimasi kasar" |

### 6.2 Halaman Hasil Pencarian (`youtube.com/results`)

| ID | Kebutuhan | Prioritas | Paket | Kriteria penerimaan |
|---|---|---|---|---|
| F-SRC-01 | Kartu ringkas keyword di atas hasil: volume relatif, tingkat persaingan, skor peluang | P0 | G (3×/hari), Pro (tak terbatas) | Skor sesuai §7.2; kuota harian direset 00:00 WIB |
| F-SRC-02 | Badge mini per hasil video: VPH dan skor | P0 | Pro | Badge tidak merusak tata letak di lebar 1280–1920 px |
| F-SRC-03 | Keyword terkait (≥ 10) termasuk variasi gaul, singkatan, dan campuran Inggris | P0 | G (5), Pro (semua) | Contoh: "cara edit video" → "cara ngedit video", "tutorial capcut", "edit video hp" |
| F-SRC-04 | Tombol "Simpan keyword" ke daftar pantauan | P1 | Pro | Tersinkron ke akun, maksimal 200 keyword |

### 6.3 Halaman Kanal (`youtube.com/@…`)

| ID | Kebutuhan | Prioritas | Paket | Kriteria penerimaan |
|---|---|---|---|---|
| F-CH-01 | Ringkasan kanal: frekuensi unggah, rata-rata views, video teratas 30/90 hari | P1 | G | Dihitung dari maksimum 50 video terbaru |
| F-CH-02 | Tombol "Pantau sebagai kompetitor" | P1 | Pro | Maksimal 10 kompetitor (Pro), 50 (Agensi) |
| F-CH-03 | Pola jam & hari unggah kanal (heatmap WIB) | P1 | Pro | Zona waktu dapat diganti ke WITA/WIT |

### 6.4 YouTube Studio (`studio.youtube.com`) — v1.1

| ID | Kebutuhan | Prioritas | Paket | Kriteria penerimaan |
|---|---|---|---|---|
| F-ST-01 | Panel "Skor SEO" real-time saat mengisi judul, deskripsi, dan tag | P1 | G | Skor diperbarui ≤ 500 ms setelah pengguna berhenti mengetik (*debounce*) |
| F-ST-02 | Tombol "Saran AI" untuk judul (5 opsi), deskripsi, dan tag | P1 | G (kredit), Pro | Output Bahasa Indonesia natural; pengguna memilih gaya: formal, santai, clickbait-ringan, edukatif |
| F-ST-03 | Penyisipan saran ke kolom Studio hanya setelah pengguna klik "Pakai" | P1 | G | Tidak pernah mengubah kolom secara otomatis tanpa aksi pengguna |
| F-ST-04 | Audit kanal: video tanpa deskripsi/tag, judul terlalu panjang, tanpa playlist | P1 | Pro | Memakai OAuth `youtube.readonly`; hasil dapat diekspor CSV |
| F-ST-05 | Rekomendasi jam unggah dari data YouTube Analytics milik pengguna | P1 | Pro | Memakai YouTube Analytics API; jika data < 28 hari, tampilkan pola umum kategori |

### 6.5 Popup Ekstensi & Asisten AI

| ID | Kebutuhan | Prioritas | Paket | Kriteria penerimaan |
|---|---|---|---|---|
| F-POP-01 | Popup: status login, sisa kredit AI, kuota keyword, tautan pengaturan | P0 | G | Terbuka ≤ 300 ms |
| F-POP-02 | Riset keyword cepat dari popup (tanpa membuka YouTube) | P0 | G | Hasil sama dengan F-SRC-01/03 |
| F-AI-01 | "Ide Video Harian": 3–5 ide berdasarkan niche kanal dan tren lokal | P1 | G (1×/hari), Pro | Setiap ide memuat judul, alasan, dan keyword target |
| F-AI-02 | Asisten tanya-jawab ("Kenapa video saya sepi?") memakai konteks data kanal | P2 | Pro | Jawaban mengutip angka dari data pengguna; tidak mengarang metrik |
| F-AI-03 | Sistem kredit AI per bulan | P0 | G/Pro | Gratis 50 kredit, Pro 1.500 kredit; 1 saran judul = 1 kredit |

### 6.6 Akun, Langganan & Pengaturan

| ID | Kebutuhan | Prioritas | Kriteria penerimaan |
|---|---|---|---|
| F-ACC-01 | Login dengan Google (OAuth 2.0 lewat `chrome.identity`) | P0 | Scope minimum; scope YouTube diminta bertahap saat fitur Studio dipakai |
| F-ACC-02 | Pembayaran Rupiah: QRIS, e-wallet, VA bank, kartu (lewat payment gateway lokal) | P0 | Webhook mengaktifkan Pro ≤ 1 menit setelah pembayaran sukses |
| F-ACC-03 | Pengaturan: aktif/nonaktif per panel, zona waktu, gaya bahasa AI, mode gelap | P0 | Disimpan di `chrome.storage.sync` |
| F-ACC-04 | Hapus akun & data (hak subjek data UU PDP) | P0 | Diproses ≤ 3×24 jam, email konfirmasi |
| F-ACC-05 | Onboarding 3 langkah setelah instal (pilih niche, zona waktu, gaya bahasa) | P0 | Dapat dilewati |

### 6.7 Lokalisasi Bahasa Indonesia (lintas fitur)

| ID | Kebutuhan | Prioritas |
|---|---|---|
| F-L10N-01 | Seluruh string UI di file `_locales/id/messages.json`; tidak ada teks hardcode | P0 |
| F-L10N-02 | Glosarium istilah baku (§17) dipakai konsisten di UI, tooltip, dan output AI | P0 |
| F-L10N-03 | Tokenizer keyword yang memahami imbuhan (me-, di-, -kan, -nya), reduplikasi, dan stopword Indonesia | P0 |
| F-L10N-04 | Kamus normalisasi gaul/singkatan ("gmn" → "gimana" → "bagaimana", "hp" → "handphone") untuk pengelompokan keyword | P0 |
| F-L10N-05 | Deteksi bahasa campuran (ID/EN) dan, di fase 2, bahasa daerah utama (Jawa, Sunda) | P2 |
| F-L10N-06 | Format angka, tanggal, dan mata uang Indonesia (`14 Nov 2026`, `Rp1.500.000`, `1,2 jt`) | P0 |

---

## 7. Definisi Skor & Metrik

Bobot di bawah ini adalah nilai awal. Bobot harus bisa disetel dari server (*remote config*) untuk eksperimen A/B.

### 7.1 Skor Kanalisa (video), 0–100

| Komponen | Bobot | Cara hitung (ringkas) |
|---|---|---|
| Kecepatan (VPH relatif) | 35% | VPH dibanding median VPH 10 video terakhir kanal, dinormalisasi log |
| Engagement | 25% | `(like + komentar) / views`, dibanding median kategori |
| Kekuatan SEO metadata | 20% | Hasil checklist F-VID-05 |
| Relevansi keyword | 20% | Kecocokan keyword utama judul dengan tag dan deskripsi (cosine similarity token ternormalisasi) |

### 7.2 Skor Peluang Keyword, 0–100

- **Volume relatif (0–100):** gabungan sinyal Google Trends (kategori YouTube Search, geo=ID) dan frekuensi kemunculan di judul video yang diunggah 30 hari terakhir. Karena YouTube tidak menyediakan volume pencarian absolut, UI wajib menyebut angka ini **"relatif"**.
- **Persaingan (0–100):** median views dan subscriber kanal pada 20 hasil teratas, ditambah proporsi judul yang memuat keyword persis.
- **Peluang** = `Volume × (100 − Persaingan) / 100`, dinormalisasi ke 0–100.
- Label: `≥70 Peluang Tinggi`, `40–69 Sedang`, `<40 Rendah`.

---

## 8. Kebutuhan Non-Fungsional

| Kategori | Kebutuhan |
|---|---|
| Performa | Panel overlay ≤ 1,5 dtk (p75); content script ≤ 150 KB gzip; tidak menurunkan skor Lighthouse halaman YouTube > 5 poin |
| Ketahanan DOM | Seleksi elemen YouTube lewat lapisan adapter terpusat; *feature flag* jarak jauh untuk mematikan panel yang rusak tanpa rilis ulang |
| Navigasi SPA | Mendeteksi navigasi YouTube (event `yt-navigate-finish` + `MutationObserver` cadangan); tidak ada kebocoran listener |
| Ketersediaan backend | 99,5% bulanan |
| Skalabilitas | Target 100 rb pengguna aktif bulanan di tahun pertama |
| Aksesibilitas | Kontras WCAG 2.1 AA, navigasi keyboard, label ARIA berbahasa Indonesia |
| Keamanan | Tidak ada API key di kode ekstensi; semua panggilan YouTube API lewat backend; token OAuth tidak dikirim ke pihak ketiga; CSP ketat MV3 |
| Observabilitas | Telemetri error anonim (opt-out tersedia), *dashboard* kesalahan selector DOM per versi YouTube |

---

## 9. Arsitektur Teknis

```
┌────────────────────── Chrome (MV3) ──────────────────────┐
│ content scripts (youtube.com, studio.youtube.com)        │
│   └─ Adapter DOM → komponen UI (Shadow DOM, Preact)       │
│ service worker  ── cache (chrome.storage.local, IndexedDB)│
│ popup / options page                                      │
└──────────────┬───────────────────────────────────────────┘
               │ HTTPS (JWT sesi)
┌──────────────▼──────────── Backend ──────────────────────┐
│ API Gateway → Layanan: Video | Keyword | AI | Billing     │
│ Cache Redis (TTL per jenis data)  · PostgreSQL (akun)     │
│ Worker antrean (tren, kompetitor, audit)                  │
└───┬───────────────┬────────────────┬──────────────┬──────┘
    │               │                │              │
 YouTube Data    YouTube         LLM provider   Payment gateway
 API v3          Analytics API   (prompt ID)    lokal (QRIS dll.)
```

### 9.1 Keputusan teknis

| Topik | Keputusan | Alasan |
|---|---|---|
| UI di halaman | Shadow DOM + Preact | Isolasi CSS dari YouTube dan bundle kecil |
| Sumber data publik | YouTube Data API v3 lewat backend | Patuh ToS; kuota dikelola terpusat |
| Data yang sudah tampil di layar | Boleh dibaca dari DOM untuk mengurangi panggilan API (judul, ID video) | Hemat kuota |
| Cache | Statistik video 15 menit, tag/metadata 24 jam, kanal 24 jam, keyword 24 jam | Menekan kuota dan latensi |
| AI | LLM via backend dengan *system prompt* berbahasa Indonesia, glosarium, dan contoh gaya; output divalidasi panjang judul ≤ 100 karakter | Konsistensi bahasa dan biaya |

### 9.2 Strategi kuota YouTube Data API

Kuota default proyek adalah 10.000 unit/hari. `search.list` sekitar 100 unit, sedangkan `videos.list`/`channels.list` sekitar 1 unit per panggilan. Angka ini perlu diverifikasi ulang ke dokumentasi resmi sebelum implementasi.

- Hindari `search.list` di sisi klien. Untuk halaman hasil pencarian, ambil ID video dari DOM lalu panggil `videos.list` secara *batch* (≤ 50 ID per panggilan).
- Riset keyword menjalankan `search.list` di backend dengan cache bersama antarpengguna (keyword yang sama = satu panggilan per 24 jam).
- Ajukan **perluasan kuota** (YouTube API Services audit) sebelum peluncuran publik. Ini masuk jalur kritis.

---

## 10. Izin Chrome & Privasi

| Izin | Alasan (dicantumkan di listing Chrome Web Store) |
|---|---|
| `storage` | Menyimpan pengaturan dan cache |
| `identity` | Login Google |
| `alarms` | Reset kuota harian dan sinkronisasi berkala |
| Host: `https://www.youtube.com/*`, `https://studio.youtube.com/*` | Menampilkan panel di halaman YouTube |
| Host: `https://api.kanalisa.id/*` (contoh) | Komunikasi ke backend |

- **Tidak meminta** `tabs`, `history`, `<all_urls>`, atau `webRequest`.
- Riwayat tontonan pengguna **tidak** dikumpulkan. Hanya ID video yang sedang dibuka dikirim ke backend untuk mengambil metrik, dan tidak disimpan terkait identitas pengguna lebih dari 24 jam.
- Kebijakan privasi berbahasa Indonesia, dapat diakses dari popup dan listing.

---

## 11. Kepatuhan

| Regulasi/Kebijakan | Implikasi |
|---|---|
| YouTube API Services Terms & Developer Policies | Atribusi "Powered by YouTube" sesuai pedoman; batas penyimpanan data non-otorisasi (refresh/hapus berkala); tidak memodifikasi atau menyembunyikan elemen inti pemutar; audit kepatuhan untuk kuota besar |
| Chrome Web Store Program Policies | Prinsip *single purpose* (analitik & SEO YouTube); *Limited Use* untuk data pengguna; tidak ada kode jarak jauh yang dieksekusi (MV3) |
| UU No. 27/2022 tentang Pelindungan Data Pribadi | Persetujuan eksplisit, hak akses/hapus/koreksi data, pemberitahuan kebocoran, penunjukan penanggung jawab pemrosesan data |
| Perpajakan & pembayaran | Faktur dalam Rupiah, PPN sesuai ketentuan yang berlaku (validasi ke konsultan pajak) |
| Merek | Tidak memakai nama, logo, atau gaya visual yang mirip vidIQ, TubeBuddy, atau YouTube; "YouTube" hanya dipakai secara deskriptif |

---

## 12. Model Bisnis (Usulan Awal)

| Paket | Harga (usulan) | Isi utama |
|---|---|---|
| **Gratis** | Rp0 | Overlay video, Skor Kanalisa (tanpa rincian), tag, 3 riset keyword/hari, 50 kredit AI/bulan |
| **Pro** | Rp49.000/bulan atau Rp399.000/tahun | Semua fitur MVP + v1.1, keyword tak terbatas, 10 kompetitor, 1.500 kredit AI |
| **Agensi** | Rp299.000/bulan | Hingga 10 kanal, 50 kompetitor, ekspor laporan, 6.000 kredit AI |
| **Edukasi/Instansi** | Kustom | Lisensi massal untuk sekolah, kampus, atau lembaga pelatihan |

Harga di atas adalah hipotesis dan perlu divalidasi lewat survei *willingness-to-pay* sebelum peluncuran.

---

## 13. Metrik Keberhasilan

| Metrik | Target 6 bulan |
|---|---|
| Instalasi | 50.000 |
| Pengguna aktif mingguan / instalasi | ≥ 35% |
| Retensi hari ke-30 | ≥ 25% |
| Konversi Gratis → Pro | ≥ 3% |
| Rating Chrome Web Store | ≥ 4,5 |
| Tingkat error panel (gagal render) | < 1% tampilan halaman |
| Kepuasan output AI ("Saran berguna" 👍) | ≥ 70% |

---

## 14. Risiko & Mitigasi

| Risiko | Kemungkinan | Dampak | Mitigasi |
|---|---|---|---|
| YouTube mengubah struktur DOM | Tinggi | Tinggi | Lapisan adapter, *feature flag* jarak jauh, uji E2E harian (Playwright) terhadap YouTube live |
| Kuota API habis | Sedang | Tinggi | Cache bersama, batching, pengajuan perluasan kuota sejak awal |
| Penolakan audit YouTube API / Chrome Web Store | Sedang | Tinggi | Ikuti kebijakan sejak desain, izin minimum, kebijakan privasi jelas |
| Volume keyword dianggap "tidak akurat" | Tinggi | Sedang | Label "relatif", jelaskan metodologi, tampilkan tren, bukan angka absolut |
| Biaya LLM membengkak | Sedang | Sedang | Sistem kredit, cache prompt umum, model kecil untuk tugas sederhana |
| Output AI kaku atau tidak natural | Sedang | Sedang | Kumpulan contoh judul lokal, evaluasi manusia berkala, umpan balik 👍/👎 |
| Persaingan dengan pemain global | Tinggi | Sedang | Diferensiasi lokal: bahasa, harga Rupiah, QRIS, komunitas dan edukasi kreator Indonesia |

---

## 15. Rencana Rilis

| Minggu | Aktivitas |
|---|---|
| 1–2 | Finalisasi PRD, desain UX (wireframe panel, popup, onboarding), pengajuan proyek Google Cloud & OAuth consent |
| 3–8 | Pengembangan MVP: content script + adapter DOM, backend Video/Keyword, login, sistem kredit |
| 9–11 | Integrasi AI, pembayaran, lokalisasi & glosarium, uji internal |
| 12–14 | Beta tertutup (100–300 kreator Indonesia), perbaikan, pengajuan perluasan kuota & review Chrome Web Store |
| 15–16 | Peluncuran publik v1.0 |
| 17–24 | v1.1: integrasi Studio, audit kanal, kompetitor, jam unggah |

---

## 16. Pertanyaan Terbuka

1. **Nama produk final.** Nama "ViflQ" terlalu mirip dengan merek vidIQ dan berisiko ditolak Chrome Web Store atau terkena klaim merek. "Kanalisa" hanya nama kerja; perlu cek ketersediaan merek di PDKI dan domain.
2. Sumber sinyal volume keyword: hanya Google Trends + data internal, atau berlangganan penyedia data pihak ketiga?
3. Penyedia LLM dan anggaran biaya per pengguna aktif.
4. Payment gateway yang dipilih dan model perpanjangan otomatis (e-wallet tertentu tidak mendukung *recurring*).
5. Apakah dashboard web penuh (di luar ekstensi) masuk MVP atau cukup halaman akun/langganan?
6. Kebijakan retensi data analitik kanal pengguna (usulan: 13 bulan).

---

## 17. Glosarium Istilah UI (Baku)

| Istilah Inggris | Istilah Kanalisa | Catatan |
|---|---|---|
| Views | Tayangan | |
| Views per hour (VPH) | Tayangan per jam (TPJ) | Tooltip: "Kecepatan video mendapat tayangan saat ini" |
| Subscribers | Subscriber | Dipertahankan; lebih dikenal daripada "pelanggan" |
| Engagement rate | Tingkat interaksi | |
| Keyword | Kata kunci | |
| Search volume | Volume pencarian (relatif) | Selalu dengan kata "relatif" |
| Competition | Persaingan | |
| Outlier | Video meledak | Label: "3,2× rata-rata kanal" |
| Channel audit | Audit kanal | |
| Tags | Tag | |
| Thumbnail | Thumbnail | Dipertahankan |
| Credits | Kredit AI | |
| Upgrade | Tingkatkan ke Pro | |

---

## Lampiran A — Contoh Alur Pengguna (MVP)

1. Pengguna memasang ekstensi → onboarding (niche, zona waktu, gaya bahasa) → login Google.
2. Membuka video di YouTube → panel Kanalisa menampilkan TPJ, Skor Kanalisa, tag, dan checklist SEO.
3. Mengetik "resep ayam geprek" di pencarian YouTube → kartu kata kunci: Volume relatif 78, Persaingan 64, Peluang 28 (Rendah) → saran kata kunci terkait dengan peluang lebih tinggi, misalnya "ayam geprek sambal matah rumahan".
4. Klik "Buat judul dengan AI" → 5 opsi judul berbahasa Indonesia natural → salin.
5. Kuota gratis habis → layar "Tingkatkan ke Pro" → bayar via QRIS → fitur Pro aktif ≤ 1 menit.
