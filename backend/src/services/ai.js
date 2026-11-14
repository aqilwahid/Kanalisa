import { config } from '../config.js';

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
Bahasa: ${language === 'id' ? 'Indonesia' : 'English'}

Kembalikan HANYA JSON array of strings:
["judul 1", "judul 2", "judul 3", "judul 4", "judul 5"]`;

  return callLLM(systemPrompt, userPrompt, { maxTokens: 500, temperature: 0.8 });
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