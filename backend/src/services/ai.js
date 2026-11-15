import { config, modes } from '../config.js';

export const isMockMode = modes.ai === 'mock';

export function normalizeStyle(style) {
  const map = {
    formal: 'formal',
    casual: 'santai',
    santai: 'santai',
    lightClickbait: 'clickbait-ringan',
    'clickbait-ringan': 'clickbait-ringan',
    educational: 'edukatif',
    edukatif: 'edukatif',
  };
  return map[style] || 'santai';
}

function mockSuggestTitles({ topic, niche, style = 'santai', count = 5 }) {
  const normalizedStyle = normalizeStyle(style);
  const cleanTopic = String(topic || 'Konten').trim();
  const capitalizedTopic = cleanTopic.charAt(0).toUpperCase() + cleanTopic.slice(1);

  const templates = {
    formal: [
      `Panduan Lengkap ${capitalizedTopic}: Strategi Efektif untuk ${niche}`,
      `Tutorial ${capitalizedTopic} untuk Pemula: Langkah demi Langkah`,
      `Analisis Mendalam ${capitalizedTopic}: Wajib Diketahui Kreator`,
      `${capitalizedTopic}: Metode Terbukti Berhasil di 2026`,
      `Strategi Optimasi ${capitalizedTopic} Secara Profesional`,
    ],
    santai: [
      `Gimana Caranya ${capitalizedTopic}? Nih Tutorial Paling Gampang!`,
      `${capitalizedTopic} Gampang Banget, Coba Deh Trik Ini`,
      `Rahasia ${capitalizedTopic} yang Jarang Dibongkar Orang`,
      `Yuk Belajar ${capitalizedTopic} Bareng Sampai Mahir`,
      `${capitalizedTopic}: 5 Tips Praktis Buat Pemula`,
    ],
    'clickbait-ringan': [
      `5 Trik ${capitalizedTopic} yang Bikin Tayangan Meledak!`,
      `Jangan Coba ${capitalizedTopic} Sebelum Tahu 3 Hal Ini!`,
      `Rahasia ${capitalizedTopic} yang Bakal Bikin Kamu Kaget!`,
      `${capitalizedTopic} Cuma 5 Menit: Hasilnya Bikin Geleng-geleng!`,
      `Ini Dia Rahasia Pro ${capitalizedTopic} yang Jarang Dipakai!`,
    ],
    edukatif: [
      `Belajar ${capitalizedTopic} dari Nol: Konsep & Praktik`,
      `Dasar-dasar ${capitalizedTopic} yang Wajib Dipahami`,
      `Langkah demi Langkah Menguasai ${capitalizedTopic}`,
      `Bedah Tuntas ${capitalizedTopic}: Dari Teori ke Eksekusi`,
      `Modul Praktis ${capitalizedTopic} untuk Pemula`,
    ],
  };

  const list = templates[normalizedStyle] || templates.santai;
  return list.slice(0, Math.min(count, list.length));
}

function mockSuggestDescription({ title, topic, niche, style = 'santai', includeTimestamps = true, includeHashtags = true, includeLinks = true }) {
  const cleanTopic = String(topic || 'konten');
  let desc = `Video ini membahas panduan lengkap ${cleanTopic} untuk niche ${niche}.\n\n`;
  desc += `Dalam video ini, kita akan membahas:\n`;
  desc += `- Cara memulai ${cleanTopic} dari nol\n`;
  desc += `- Tips dan trik penting yang terbukti berhasil\n`;
  desc += `- Kesalahan umum yang harus dihindari\n\n`;

  if (includeTimestamps) {
    desc += `⏱ DAFTAR ISI:\n`;
    desc += `00:00 - Pembuka\n`;
    desc += `01:30 - Persiapan & Alat\n`;
    desc += `03:45 - Langkah Utama\n`;
    desc += `07:15 - Tips Praktis\n`;
    desc += `09:30 - Penutup & Kesimpulan\n\n`;
  }

  if (includeHashtags) {
    const tagWord = cleanTopic.replace(/[^a-zA-Z0-9]/g, '');
    desc += `#${tagWord} #${niche} #Tutorial #Tips #KreatorIndonesia\n\n`;
  }

  if (includeLinks) {
    desc += `📱 Tautan & Media Sosial:\n`;
    desc += `Website: https://kanalisa.id\n`;
    desc += `Instagram: @kanalisa\n`;
  }

  return { description: desc.trim() };
}

function mockSuggestTags({ title, description, topic, niche, maxTags = 15 }) {
  const cleanTopic = String(topic || 'konten').toLowerCase();
  const baseTags = [
    cleanTopic,
    niche.toLowerCase(),
    `tutorial ${cleanTopic}`,
    `cara ${cleanTopic}`,
    `${cleanTopic} pemula`,
    `${cleanTopic} 2026`,
    `${cleanTopic} indonesia`,
    'tips',
    'panduan',
    'kreator indonesia',
    'belajar',
    'mudah',
  ];
  return { tags: baseTags.slice(0, Math.min(maxTags, 15)) };
}

function mockSuggestVideoIdeas({ niche, channelData, count = 5 }) {
  const ideas = [
    { title: `Cara Mengembangkan Kanal ${niche} dari Nol`, reason: 'Format evergreen yang terus dicari kreator pemula', targetKeywords: [niche, 'pemula', 'tutorial', 'tips'] },
    { title: `5 Kesalahan Fatal di Niche ${niche} yang Sering Dilakukan`, reason: 'Format kesalahan memiliki tingkat klik dan retensi tinggi', targetKeywords: [niche, 'kesalahan', 'tips', 'hindari'] },
    { title: `Review Alat & Perlengkapan Terbaik untuk ${niche}`, reason: 'Audiens memiliki niat beli tinggi saat mencari ulasan alat', targetKeywords: [niche, 'review', 'terbaik', 'alat'] },
    { title: `Trik Cepat Mahir ${niche} Tanpa Ribet`, reason: 'Format panduan cepat sangat disukai audiens pemula', targetKeywords: [niche, 'cepat', 'mahir', 'trik'] },
    { title: `Studi Kasus: Cara Video ${niche} Bisa Meledak`, reason: 'Analisis mendalam membangun kredibilitas dan loyalitas audiens', targetKeywords: [niche, 'analisis', 'studi kasus', 'meledak'] },
  ];
  return { ideas: ideas.slice(0, count) };
}

function mockAnswerQuestion({ question, channelData, videoData }) {
  return {
    answer: `Berdasarkan analisis data Kanalisa untuk pertanyaan "${question}": optimalkan kata kunci utama pada 40 karakter pertama judul, tambahkan timestamp dan hashtag relevan pada deskripsi, serta bandingkan TPJ (tayangan per jam) dengan median kanal Anda.`,
  };
}

const GLOSSARY = {
  'Views': 'Tayangan',
  'Views per hour (VPH)': 'Tayangan per jam (TPJ)',
  'Subscribers': 'Subscriber',
  'Engagement rate': 'Tingkat interaksi',
  'Keyword': 'Kata kunci',
  'Search volume': 'Volume pencarian (relatif)',
  'Competition': 'Persaingan',
  'Outlier': 'Video meledak',
  'Channel audit': 'Audit kanal',
  'Tags': 'Tag',
  'Thumbnail': 'Thumbnail',
  'Credits': 'Kredit AI',
  'Upgrade': 'Tingkatkan ke Pro',
};

const STYLE_PROMPTS = {
  formal: 'Gaya formal, baku, profesional. Gunakan EYD yang benar. Cocok untuk konten edukasi, bisnis, berita.',
  santai: 'Gaya santai, natural, seperti ngobrol sama teman. Boleh pakai bahasa gaul ringan (mis. "gimana", "nih", "banget"). Cocok untuk vlog, lifestyle, hiburan.',
  'clickbait-ringan': 'Gaya menarik perhatian tapi tidak menipu. Pakai angka, rasa penasaran, benefit jelas. Contoh: "5 Cara Edit Video Cuma 5 Menit!" Cocok untuk tutorial, tips.',
  edukatif: 'Gaya mengajar, step-by-step, jelas dan terstruktur. Fokus pada value pembelajaran. Cocok untuk how-to, kursus, panduan.',
};

function buildSystemPrompt(style = 'santai') {
  const normalizedStyle = normalizeStyle(style);
  const styleDesc = STYLE_PROMPTS[normalizedStyle] || STYLE_PROMPTS.santai;

  return `Kamu adalah asisten SEO YouTube berbahasa Indonesia untuk kreator Indonesia.
Nama layanan: Kanalisa.

ATURAN WAJIB:
1. Selalu gunakan Bahasa Indonesia yang natural.
2. Gunakan istilah baku Kanalisa:
${Object.entries(GLOSSARY).map(([en, id]) => `- ${en} → ${id}`).join('\n')}
3. Judul maksimal 100 karakter.
4. Deskripsi maksimal 5000 karakter.
5. Tag: maksimal 15 tag relevan.
6. JANGAN mengarang angka metrik palsu.
7. Output HANYA JSON valid.

GAYA BAHASA: ${styleDesc}`;
}

export async function suggestTitles({ topic, niche, style = 'santai', count = 5 }) {
  const normalizedStyle = normalizeStyle(style);
  if (isMockMode) {
    return mockSuggestTitles({ topic, niche, style: normalizedStyle, count });
  }

  const systemPrompt = buildSystemPrompt(normalizedStyle);
  const userPrompt = `Buat ${count} opsi judul YouTube untuk topik: "${topic}". Niche: ${niche}. Gaya: ${normalizedStyle}. Kembalikan JSON format: { "titles": ["judul 1", "judul 2", ...] }`;

  const response = await callLLM(systemPrompt, userPrompt, { maxTokens: 400 });
  return Array.isArray(response.titles) ? response.titles.slice(0, count) : [];
}

export async function suggestDescription({ title, topic, niche, style = 'santai', includeTimestamps = true, includeHashtags = true, includeLinks = true }) {
  const normalizedStyle = normalizeStyle(style);
  if (isMockMode) {
    return mockSuggestDescription({ title, topic, niche, style: normalizedStyle, includeTimestamps, includeHashtags, includeLinks });
  }

  const systemPrompt = buildSystemPrompt(normalizedStyle);
  const userPrompt = `Buat deskripsi YouTube untuk video: "${title}", Topik: ${topic}, Niche: ${niche}. Sertakan ${includeTimestamps ? 'timestamp' : ''}, ${includeHashtags ? 'hashtag' : ''}. Kembalikan JSON format: { "description": "..." }`;

  return callLLM(systemPrompt, userPrompt, { maxTokens: 1000 });
}

export async function suggestTags({ title, description, topic, niche, maxTags = 15 }) {
  if (isMockMode) {
    return mockSuggestTags({ title, description, topic, niche, maxTags });
  }

  const systemPrompt = buildSystemPrompt('edukatif');
  const userPrompt = `Buat maksimal ${maxTags} tag YouTube untuk judul: "${title}", topik: ${topic}, niche: ${niche}. Kembalikan JSON format: { "tags": ["tag1", "tag2", ...] }`;

  return callLLM(systemPrompt, userPrompt, { maxTokens: 300 });
}

export async function suggestVideoIdeas({ niche, channelData, count = 5 }) {
  if (isMockMode) {
    return mockSuggestVideoIdeas({ niche, channelData, count });
  }

  const systemPrompt = buildSystemPrompt('edukatif');
  const userPrompt = `Berikan ${count} ide video YouTube untuk niche "${niche}". Kembalikan JSON: { "ideas": [{ "title": "...", "reason": "...", "targetKeywords": ["..."] }] }`;

  return callLLM(systemPrompt, userPrompt, { maxTokens: 800 });
}

export async function answerQuestion({ question, channelData, videoData }) {
  if (isMockMode) {
    return mockAnswerQuestion({ question, channelData, videoData });
  }

  const systemPrompt = `Kamu adalah asisten analitik YouTube berbahasa Indonesia dari Kanalisa. Gunakan data yang diberikan secara akurat. Output JSON format: { "answer": "..." }`;
  const userPrompt = `Pertanyaan: "${question}". Data: ${JSON.stringify({ channelData, videoData })}`;

  return callLLM(systemPrompt, userPrompt, { maxTokens: 500 });
}

async function callLLM(systemPrompt, userPrompt, options = {}) {
  const { maxTokens = 500, temperature = 0.7 } = options;

  try {
    const url = `${config.LLM_BASE_URL.replace(/\/+$/, '')}/chat/completions`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.LLM_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: config.LLM_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        max_tokens: maxTokens,
        temperature,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`LLM API returned ${response.status}: ${errorText.slice(0, 200)}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) throw new Error('Respon LLM kosong');

    return JSON.parse(content);
  } catch (err) {
    console.error('LLM API error:', err.message);
    throw new Error(`Layanan AI sedang tidak tersedia: ${err.message}`);
  }
}

export function getCreditCost(operation) {
  const costs = {
    'suggest-title': 1,
    'suggest-description': 2,
    'suggest-tags': 1,
    'suggest-ideas': 3,
    'answer-question': 2,
  };
  return costs[operation] || 1;
}
