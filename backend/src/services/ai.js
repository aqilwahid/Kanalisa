import { config } from '../config.js';

const USE_MOCK = config.LLM_API_KEY === 'test-llm-key' || !config.LLM_API_KEY;

function mockSuggestTitles({ topic, niche, style = 'santai', count = 5 }) {
  const templates = {
    formal: [
      `Cara ${topic.charAt(0).toUpperCase() + topic.slice(1)}: Panduan Lengkap`,
      `Tutorial ${topic} untuk Pemula: Langkah demi Langkah`,
      `Analisis ${topic}: Strategi Terbaik untuk ${niche}`,
      `Panduan ${topic} Profesional: Tips & Trik`,
      `${topic.charAt(0).toUpperCase() + topic.slice(1)}: Metode Terbukti Efektif`,
    ],
    santai: [
      `Gimana Caranya ${topic}? Nih Tutorialnya!`,
      `${topic.charAt(0).toUpperCase() + topic.slice(1)} Gampang Banget, Coba Deh`,
      `Rahasia ${topic} yang Jarang Dibahas`,
      `Yuk Belajar ${topic} Bareng Sama Gue`,
      `${topic.charAt(0).toUpperCase() + topic.slice(1)}: Tips Buat Pemula`,
    ],
    'clickbait-ringan': [
      `5 Cara ${topic} Cuma 5 Menit!`,
      `${topic.charAt(0).toUpperCase() + topic.slice(1)}: Jangan Sampai Ketinggalan!`,
      `Rahasia ${topic} yang Bikin Kamu Terkejut`,
      `${topic.charAt(0).toUpperCase() + topic.slice(1)}: 3 Trik Rahasia Pro`,
      `Ini Dia Cara ${topic} Paling Ampuh!`,
    ],
    edukatif: [
      `Belajar ${topic} dari Nol: Modul 1`,
      `Dasar-dasar ${topic} untuk Pemula`,
      `Step-by-Step ${topic}: Panduan Praktis`,
      `Konsep ${topic} yang Wajib Kamu Pahami`,
      `Latihan ${topic}: Dari Teori ke Praktik`,
    ],
  };
  
  const styleTemplates = templates[style] || templates.santai;
  return styleTemplates.slice(0, count);
}

function mockSuggestDescription({ title, topic, niche, style = 'santai', includeTimestamps = true, includeHashtags = true, includeLinks = true }) {
  let desc = `Video ini membahas ${topic} secara mendalam untuk niche ${niche}.\n\n`;
  desc += `Dalam video ini, kamu akan belajar:\n`;
  desc += `- Cara memulai ${topic}\n`;
  desc += `- Tips dan trik yang efektif\n`;
  desc += `- Kesalahan yang harus dihindari\n\n`;
  
  if (includeTimestamps) {
    desc += `⏱ TIMESTAMP:\n`;
    desc += `0:00 - Intro\n`;
    desc += `1:30 - Persiapan\n`;
    desc += `3:00 - Tutorial Utama\n`;
    desc += `8:00 - Tips Tambahan\n`;
    desc += `10:00 - Penutup\n\n`;
  }
  
  if (includeHashtags) {
    desc += `#${topic.replace(/\s+/g, '')} #${niche} #Tutorial #Tips #Belajar\n\n`;
  }
  
  if (includeLinks) {
    desc += `📱 Ikuti kami:\n`;
    desc += `Instagram: @kanalisa\n`;
    desc += `TikTok: @kanalisa\n`;
    desc += `Subscribe: youtube.com/@kanalisa\n`;
  }
  
  return { description: desc };
}

function mockSuggestTags({ title, description, topic, niche, maxTags = 15 }) {
  const baseTags = [topic, niche, 'tutorial', 'tips', 'indonesia', 'cara', 'panduan', 'belajar', 'mudah', 'pemula'];
  return { tags: baseTags.slice(0, maxTags) };
}

function mockSuggestVideoIdeas({ niche, channelData, count = 5 }) {
  const ideas = [
    { title: `Cara ${niche} untuk Pemula`, reason: 'Konten evergreen yang selalu dicari pemula', targetKeywords: [niche, 'pemula', 'tutorial', 'cara'] },
    { title: `5 Kesalahan ${niche} yang Harus Dihindari`, reason: 'Format "kesalahan" performa tinggi untuk retensi', targetKeywords: [niche, 'kesalahan', 'tips', 'hindari'] },
    { title: `Review Alat ${niche} Terbaik 2024`, reason: 'Konten review produk memiliki CTR tinggi', targetKeywords: [niche, 'review', 'terbaik', 'alat'] },
    { title: `Tips ${niche} Agar Cepat Mahir`, reason: 'Audience suka konten "cepat mahir" / shortcut', targetKeywords: [niche, 'tips', 'cepat', 'mahir'] },
    { title: `Rahasia ${niche} yang Jarang Dibahas`, reason: 'Konten "rahasia" / insider knowledge bikin penasaran', targetKeywords: [niche, 'rahasia', 'insider', 'tips'] },
  ];
  return { ideas: ideas.slice(0, count) };
}

function mockAnswerQuestion({ question, channelData, videoData }) {
  return { answer: `Berdasarkan data yang tersedia, untuk pertanyaan "${question}": fokus pada konsistensi upload, optimasi judul & thumbnail, dan interaksi dengan komunitas. Data kanal menunjukkan peluang pertumbuhan di niche ${channelData?.niche || 'umum'}.` };
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
  const styleDesc = STYLE_PROMPTS[style] || STYLE_PROMPTS.santai;
  
  return `Kamu adalah asisten SEO YouTube berbahasa Indonesia untuk kreator Indonesia.
Nama layanan: Kanalisa.

ATURAN WAJIB:
1. Selalu gunakan Bahasa Indonesia yang natural (campuran formal/santai sesuai gaya).
2. Gunakan istilah baku Kanalisa (glosarium di bawah) — JANGAN pakai istilah Inggris.
3. Judul maksimal 100 karakter.
4. Deskripsi maksimal 5000 karakter.
5. Tag: pisahkan dengan koma, maksimal 15 tag.
6. JANGAN mengarang metrik/angka yang tidak diberikan.
7. Output HANYA JSON valid sesuai schema yang diminta.

GLOSARIUM BAKU (wajib dipakai):
${Object.entries(GLOSSARY).map(([en, id]) => `- ${en} → ${id}`).join('\n')}

GAYA BAHASA: ${styleDesc}

CONTOH JUDUL BAIK:
- "Cara Edit Video CapCut di HP untuk Pemula (Lengkap)"
- "5 Tips Naikkan Tayangan YouTube Shorts Otomatis"
- "Review HP Gaming Terbaik Bawah 3 Jutaan 2024"
- "Tutorial Buat Thumbnail Keren Tanpa Photoshop"`;
}

export async function suggestTitles({ topic, niche, style = 'santai', count = 5, language = 'id' }) {
  const systemPrompt = buildSystemPrompt(style);
  
  const userPrompt = `Buat ${count} opsi judul YouTube untuk topik: "${topic}"
Niche kanal: ${niche}
Gaya: ${style}
Bahasa: ${language === 'id' ? 'Indonesia' : 'English'}

Kembalikan HANYA JSON array of strings:
["judul 1", "judul 2", "judul 3", "judul 4", "judul 5"]`;

  console.log('[DEBUG] suggestTitles called with:', { topic, niche, style, count });
  console.log('[DEBUG] USE_MOCK:', USE_MOCK);
  
  try {
    const result = await callLLM(systemPrompt, userPrompt, { maxTokens: 500, temperature: 0.8 });
    console.log('[DEBUG] callLLM result:', result);
    return result;
  } catch (err) {
    console.error('[DEBUG] callLLM error:', err.message);
    throw err;
  }
}

export async function suggestDescription({ title, topic, niche, style = 'santai', includeTimestamps = true, includeHashtags = true, includeLinks = true }) {
  const systemPrompt = buildSystemPrompt(style);
  
  const userPrompt = `Buat deskripsi YouTube untuk video berjudul: "${title}"
Topik: ${topic}
Niche: ${niche}

Sertakan:
${includeTimestamps ? '- Timestamp/daftar isi' : ''}
${includeHashtags ? '- 3-5 hashtag relevan' : ''}
${includeLinks ? '- Placeholder link sosial media & subscribe' : ''}

Kembalikan HANYA JSON: { "description": "..." }`;

  return callLLM(systemPrompt, userPrompt, { maxTokens: 1000, temperature: 0.7 });
}

export async function suggestTags({ title, description, topic, niche, maxTags = 15 }) {
  const systemPrompt = buildSystemPrompt('edukatif');
  
  const userPrompt = `Buat tag YouTube (maks ${maxTags} tag) untuk:
Judul: "${title}"
Deskripsi: ${description?.slice(0, 500) || 'Tidak ada'}
Topik: ${topic}
Niche: ${niche}

Kembalikan HANYA JSON array of strings: ["tag1", "tag2", ...]`;

  return callLLM(systemPrompt, userPrompt, { maxTokens: 300, temperature: 0.5 });
}

export async function suggestVideoIdeas({ niche, channelData, count = 5 }) {
  const systemPrompt = buildSystemPrompt('edukatif');
  
  const userPrompt = `Berikan ${count} ide video YouTube untuk niche: "${niche}"
Data kanal: ${JSON.stringify(channelData || {})}

Setiap ide harus berisi: judul, alasan (1-2 kalimat), kata kunci target (3-5 kata).

Kembalikan HANYA JSON array:
[{"title": "...", "reason": "...", "targetKeywords": ["...", "..."]}]`;

  return callLLM(systemPrompt, userPrompt, { maxTokens: 800, temperature: 0.8 });
}

export async function answerQuestion({ question, channelData, videoData }) {
  const systemPrompt = `Kamu adalah asisten analitik YouTube berbahasa Indonesia.
Gunakan HANYA data yang diberikan. JANGAN mengarang angka.
Jawab singkat, actionable, bahasa natural.`;

  const userPrompt = `Pertanyaan: "${question}"
Data kanal: ${JSON.stringify(channelData || {})}
Data video: ${JSON.stringify(videoData || {})}

Jawab dalam Bahasa Indonesia.`;

  return callLLM(systemPrompt, userPrompt, { maxTokens: 500, temperature: 0.3 });
}

async function callLLM(systemPrompt, userPrompt, options = {}) {
  console.log('[DEBUG] callLLM called, USE_MOCK:', USE_MOCK);
  if (USE_MOCK) {
    console.log('[MOCK] LLM call - returning mock response');
    console.log('[MOCK] systemPrompt contains SEO:', systemPrompt.includes('asisten SEO YouTube'));
    console.log('[MOCK] userPrompt:', userPrompt.substring(0, 200));
    // Determine which mock function to call based on system prompt
    if (systemPrompt.includes('asisten SEO YouTube')) {
      if (userPrompt.includes('Buat') && userPrompt.includes('opsi judul')) {
        // Extract topic, niche, style from userPrompt
        const topicMatch = userPrompt.match(/topik: "([^"]+)"/);
        const nicheMatch = userPrompt.match(/Niche kanal: ([^\n]+)/);
        const styleMatch = userPrompt.match(/Gaya: (\w+)/);
        const countMatch = userPrompt.match(/(\d+) opsi/);
        console.log('[MOCK] Extracted:', { topic: topicMatch?.[1], niche: nicheMatch?.[1], style: styleMatch?.[1], count: countMatch?.[1] });
        return mockSuggestTitles({ 
          topic: topicMatch?.[1] || 'mock', 
          niche: nicheMatch?.[1] || 'mock', 
          style: styleMatch?.[1] || 'santai', 
          count: countMatch ? parseInt(countMatch[1]) : 5 
        });
      }
      if (userPrompt.includes('deskripsi YouTube')) {
        const titleMatch = userPrompt.match(/berjudul: "([^"]+)"/);
        const topicMatch = userPrompt.match(/Topik: ([^\n]+)/);
        const nicheMatch = userPrompt.match(/Niche: ([^\n]+)/);
        return mockSuggestDescription({ 
          title: titleMatch?.[1] || 'mock', 
          topic: topicMatch?.[1] || 'mock', 
          niche: nicheMatch?.[1] || 'mock' 
        });
      }
      if (userPrompt.includes('tag YouTube')) {
        const titleMatch = userPrompt.match(/Judul: "([^"]+)"/);
        const topicMatch = userPrompt.match(/Topik: ([^\n]+)/);
        const nicheMatch = userPrompt.match(/Niche: ([^\n]+)/);
        return mockSuggestTags({ 
          title: titleMatch?.[1] || 'mock', 
          topic: topicMatch?.[1] || 'mock', 
          niche: nicheMatch?.[1] || 'mock' 
        });
      }
      if (userPrompt.includes('ide video')) {
        const nicheMatch = userPrompt.match(/niche: "([^"]+)"/);
        return mockSuggestVideoIdeas({ niche: nicheMatch?.[1] || 'mock' });
      }
    }
    if (systemPrompt.includes('asisten analitik YouTube')) {
      const questionMatch = userPrompt.match(/Pertanyaan: "([^"]+)"/);
      return mockAnswerQuestion({ question: questionMatch?.[1] || 'mock' });
    }
    return {};
  }
  
  const { maxTokens = 500, temperature = 0.7 } = options;
  
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
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
      const error = await response.text();
      throw new Error(`LLM API error: ${response.status} ${error}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) {
      throw new Error('Empty response from LLM');
    }

    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch {
      throw new Error('Invalid JSON from LLM');
    }

    return validateAndSanitize(parsed);
  } catch (err) {
    console.error('LLM call error:', err.message);
    throw new Error(`AI service unavailable: ${err.message}`);
  }
}

function validateAndSanitize(data) {
  if (Array.isArray(data)) {
    return data
      .filter(item => typeof item === 'string' && item.length > 0)
      .map(item => item.slice(0, 100))
      .slice(0, 10);
  }
  
  if (data.description) {
    return { description: String(data.description).slice(0, 5000) };
  }
  
  if (data.title) {
    return { title: String(data.title).slice(0, 100) };
  }
  
  if (data.tags && Array.isArray(data.tags)) {
    return { tags: data.tags.filter(t => typeof t === 'string').slice(0, 15) };
  }
  
  if (data.ideas && Array.isArray(data.ideas)) {
    return { ideas: data.ideas.slice(0, 10) };
  }
  
  if (data.answer) {
    return { answer: String(data.answer).slice(0, 1000) };
  }
  
  return data;
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