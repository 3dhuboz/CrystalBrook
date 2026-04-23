/**
 * Crystal Brook — Image Builder Worker
 *
 * Two-stage AI pipeline:
 *   1. Llama 3.1 8B Instruct expands Max's plain-English description
 *      ("a cairns butterfly") into a detailed FLUX prompt with proper
 *      species/model names, colours and pose ("Cairns Birdwing
 *      (Ornithoptera euphorion), jet-black wings with iridescent
 *      emerald-green and golden-yellow markings, wings fully spread,
 *      isolated on pure white background, …").
 *   2. FLUX 1 Schnell generates 4 variations from that detailed prompt
 *      in parallel.
 *
 * Endpoints:
 *   POST /api/studio/generate
 *     Body: { subject: string, category?: string, count?: number = 4,
 *             prompt?: string (legacy override) }
 *     Response: {
 *       generations: [{ id, url, prompt, expandedPrompt, model, seed, createdAt }],
 *       expandedPrompt: string
 *     }
 *
 *   GET /health → service banner
 */

const STUDIO_VERSION = 'cb-image-builder-2.0';

const ALLOWED_ORIGINS = new Set([
  'https://3dhuboz.github.io',
  'http://localhost:8766',
  'http://127.0.0.1:8766',
  'http://localhost:5173',
  'http://localhost:8787',
]);

function corsHeaders(origin) {
  const ok = origin && ALLOWED_ORIGINS.has(origin);
  return {
    'Access-Control-Allow-Origin': ok ? origin : 'https://3dhuboz.github.io',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
  };
}

function json(data, init = {}, cors = {}) {
  return new Response(JSON.stringify(data), {
    status: init.status || 200,
    headers: { ...cors, 'Content-Type': 'application/json', ...(init.headers || {}) },
  });
}

/**
 * Detect image mime by sniffing magic bytes.
 *   FF D8 FF       → JPEG
 *   89 50 4E 47    → PNG
 *   47 49 46 38    → GIF
 *   52 49 46 46    → WebP (RIFF)
 */
function detectMime(b0, b1, b2, b3) {
  if (b0 === 0xff && b1 === 0xd8 && b2 === 0xff) return 'image/jpeg';
  if (b0 === 0x89 && b1 === 0x50 && b2 === 0x4e && b3 === 0x47) return 'image/png';
  if (b0 === 0x47 && b1 === 0x49 && b2 === 0x46) return 'image/gif';
  if (b0 === 0x52 && b1 === 0x49 && b2 === 0x46 && b3 === 0x46) return 'image/webp';
  return 'image/png';
}

function toDataUrl(image) {
  if (typeof image === 'string') {
    // Base64 string from FLUX schnell
    const head = atob(image.slice(0, 8));
    const mime = detectMime(head.charCodeAt(0), head.charCodeAt(1), head.charCodeAt(2), head.charCodeAt(3));
    return `data:${mime};base64,${image}`;
  }
  let bytes;
  if (image instanceof Uint8Array) bytes = image;
  else if (image instanceof ArrayBuffer) bytes = new Uint8Array(image);
  else throw new Error('Unknown image format from Workers AI');

  const mime = detectMime(bytes[0], bytes[1], bytes[2], bytes[3]);
  let bin = '';
  const chunk = 8192;
  for (let i = 0; i < bytes.length; i += chunk) {
    bin += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return `data:${mime};base64,${btoa(bin)}`;
}

/* ---------- Stage 1: Llama prompt expansion ---------- */

const CATEGORY_HINTS = {
  saltwater:  'Australian saltwater fish (Great Barrier Reef, Coral Sea). Always specify scientific name, exact colour patterns, fin shapes. Use "side profile" pose unless specified.',
  freshwater: 'Australian freshwater fish (Murray-Darling, FNQ rivers, NT billabongs). Specify scientific name, scale colours, distinctive markings. Use "side profile" pose.',
  cars:       'Australian or American classic muscle cars (1960s–1980s). Specify exact year + model + period-correct paint colour. Always "side profile, no background reflections, glossy paintwork".',
  animals:    'Australian wildlife or pet portrait. Specify breed/species, exact coat colour, distinctive features. Three-quarter or side pose. Soft studio lighting, hyperrealistic fur.',
  birds:      'Australian native bird species. Specify exact species (scientific name), plumage colours, perched or in-flight pose, distinctive features (e.g. lorikeet rainbow gradient).',
  other:      'A standalone subject for an artist\'s wall-mounted resin-coated print. Be specific about colour, material, pose, era.',
};

const FLUX_SUFFIX = 'isolated on pure white background, hyperrealistic, studio lighting, no shadow, sharp detail, 8k product photography';

async function expandPrompt(env, subject, category) {
  const hint = CATEGORY_HINTS[category] || CATEGORY_HINTS.other;
  const system = `You are a prompt engineer for Crystal Brook Wall Mounts — an Australian artist who makes resin-coated wall mounts. Your job: turn the user's short description into a single, detailed FLUX 1 image-generation prompt.

Category context: ${hint}

Rules:
- Output ONE single sentence/paragraph, no preamble, no explanation, no quotes.
- Always end with: "${FLUX_SUFFIX}"
- If the user names a regional Australian species or model, include its scientific name OR exact year+model in parentheses, plus its distinctive features (colours, markings, pose).
- If the description is vague (e.g. "a fish"), make a reasonable specific choice for an Australian audience.
- Keep it under 80 words.

Example user inputs and your outputs:
USER: a cairns butterfly
YOU: Cairns Birdwing butterfly (Ornithoptera euphorion), Australia's largest butterfly, jet-black wings with iridescent emerald-green and golden-yellow markings, wings fully spread in display position, ${FLUX_SUFFIX}

USER: a 1971 monaro
YOU: 1971 Holden HQ Monaro GTS, side profile, lime-green body with black side stripes and bonnet decals, period-correct chrome bumpers and Magnum 500 wheels, ${FLUX_SUFFIX}

USER: a barra jumping
YOU: Barramundi (Lates calcarifer) leaping out of water mid-strike, silver-green flank catching light, mouth open showing white interior, water droplets frozen mid-air, ${FLUX_SUFFIX}`;

  try {
    const result = await env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
      messages: [
        { role: 'system', content: system },
        { role: 'user',   content: subject },
      ],
      max_tokens: 220,
      temperature: 0.45,
    });
    let out = (result.response || '').trim();
    // Strip surrounding quotes / "YOU:" prefix if Llama added them
    out = out.replace(/^["']|["']$/g, '').replace(/^YOU:\s*/i, '').trim();
    if (out.length < 20) {
      // Fallback if Llama returned nothing useful
      return `${subject}, ${FLUX_SUFFIX}`;
    }
    // Ensure the FLUX_SUFFIX is in there
    if (!out.toLowerCase().includes('isolated on pure white')) {
      out = `${out}, ${FLUX_SUFFIX}`;
    }
    return out;
  } catch (err) {
    console.error('Llama expand failed:', err);
    return `${subject}, ${FLUX_SUFFIX}`;
  }
}

/* ---------- Stage 2: FLUX generation ---------- */

async function generateImages(env, prompt, count) {
  const n = Math.max(1, Math.min(6, parseInt(count, 10) || 4));
  const promises = Array.from({ length: n }, async (_, i) => {
    const seed = Math.floor(Math.random() * 1_000_000);
    try {
      const result = await env.AI.run('@cf/black-forest-labs/flux-1-schnell', {
        prompt,
        num_steps: 4,
        seed,
      });
      const url = toDataUrl(result.image || result);
      return {
        id: `gen-${Date.now()}-${seed}`,
        url,
        prompt,
        model: 'flux-1-schnell',
        seed,
        createdAt: Date.now(),
      };
    } catch (err) {
      return { error: err?.message || String(err), seed };
    }
  });
  const settled = await Promise.all(promises);
  return {
    generations: settled.filter(g => !g.error),
    failures:    settled.filter(g => g.error),
  };
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    const cors = corsHeaders(origin);

    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });

    const url = new URL(request.url);

    if (url.pathname === '/' || url.pathname === '/health') {
      return json({
        ok: true,
        service: STUDIO_VERSION,
        endpoints: ['POST /api/studio/generate'],
        time: new Date().toISOString(),
      }, {}, cors);
    }

    if (url.pathname === '/api/studio/generate' && request.method === 'POST') {
      let body;
      try { body = await request.json(); }
      catch { return json({ error: 'Invalid JSON body' }, { status: 400 }, cors); }

      const { subject, category, count = 4, prompt: legacyPrompt } = body || {};
      if (!env.AI) {
        return json({ error: 'AI binding missing' }, { status: 500 }, cors);
      }

      // Two-stage pipeline: expand → generate
      // (legacyPrompt path: if a fully-formed prompt is sent, skip Llama)
      let finalPrompt;
      let expandedFromLlama = false;
      if (legacyPrompt && typeof legacyPrompt === 'string' && legacyPrompt.trim().length >= 3) {
        finalPrompt = legacyPrompt.trim();
      } else if (subject && typeof subject === 'string' && subject.trim().length >= 2) {
        finalPrompt = await expandPrompt(env, subject.trim(), category || 'other');
        expandedFromLlama = true;
      } else {
        return json({ error: 'subject (or prompt) required' }, { status: 400 }, cors);
      }

      try {
        const result = await generateImages(env, finalPrompt, count);
        if (!result.generations.length) {
          return json({ error: 'All generations failed', failures: result.failures, prompt: finalPrompt },
                      { status: 502 }, cors);
        }
        return json({
          generations: result.generations,
          failures: result.failures,
          expandedPrompt: finalPrompt,
          expandedFromLlama,
        }, {}, cors);
      } catch (err) {
        return json({ error: err?.message || String(err), prompt: finalPrompt }, { status: 500 }, cors);
      }
    }

    return json({ error: 'Not found', path: url.pathname }, { status: 404 }, cors);
  },
};
