/**
 * Crystal Brook — Image Builder Worker
 *
 * Endpoints:
 *   POST /api/studio/generate
 *     Body: { prompt: string, count?: number = 4 }
 *     Response: { generations: [{ id, url, prompt, model, seed, createdAt }] }
 *     Calls Cloudflare Workers AI's FLUX 1 Schnell model in parallel,
 *     returns base64 data URLs (so the admin frontend can render them
 *     immediately and offer a download link with no extra fetch).
 *
 *   POST /api/studio/remove-bg
 *     Body: { image: string (data: URL or https URL) }
 *     Response: { url: string (transparent PNG data URL) }
 *     Strips the white background using a small canvas-style algorithm
 *     suitable for FLUX's near-white product photos.
 *
 *   GET /health
 *     Returns 200 + version banner.
 *
 * No client-side API key needed — the Worker uses its AI binding which
 * is authenticated by Cloudflare on the platform side.
 */

const STUDIO_VERSION = 'cb-image-builder-1.0';

// Echo the request origin if it's in our allowlist; fall back to the
// production origin so curl / health checks still work.
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
 * Convert a Workers AI image binary (Uint8Array) to a base64 data URL.
 * Workers AI's FLUX returns raw PNG bytes via response.image OR via the
 * raw response body depending on the SDK shape. Handle both.
 */
function toDataUrl(image) {
  let bytes;
  if (image instanceof Uint8Array) {
    bytes = image;
  } else if (image instanceof ArrayBuffer) {
    bytes = new Uint8Array(image);
  } else if (typeof image === 'string') {
    // Already base64 — wrap it
    return `data:image/png;base64,${image}`;
  } else {
    throw new Error('Unknown image format from Workers AI');
  }
  // Convert to base64
  let bin = '';
  const chunk = 8192;
  for (let i = 0; i < bytes.length; i += chunk) {
    bin += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return `data:image/png;base64,${btoa(bin)}`;
}

async function generate(env, prompt, count) {
  const n = Math.max(1, Math.min(6, parseInt(count, 10) || 4));
  const promises = Array.from({ length: n }, async (_, i) => {
    const seed = Math.floor(Math.random() * 1_000_000);
    try {
      const result = await env.AI.run('@cf/black-forest-labs/flux-1-schnell', {
        prompt,
        num_steps: 4,        // Schnell is tuned for 1-4 steps
        seed,
      });
      // FLUX schnell returns { image: <base64-string> } per Workers AI docs
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
  const ok = settled.filter(g => !g.error);
  const failed = settled.filter(g => g.error);
  return { generations: ok, failures: failed };
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    const cors = corsHeaders(origin);

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors });
    }

    const url = new URL(request.url);

    // Health check — visit in browser to confirm the Worker is alive
    if (url.pathname === '/' || url.pathname === '/health') {
      return json({
        ok: true,
        service: STUDIO_VERSION,
        endpoints: ['POST /api/studio/generate'],
        time: new Date().toISOString(),
      }, {}, cors);
    }

    // Generate
    if (url.pathname === '/api/studio/generate' && request.method === 'POST') {
      let body;
      try { body = await request.json(); }
      catch { return json({ error: 'Invalid JSON body' }, { status: 400 }, cors); }

      const { prompt, count = 4 } = body || {};
      if (!prompt || typeof prompt !== 'string' || prompt.trim().length < 3) {
        return json({ error: 'prompt required (min 3 chars)' }, { status: 400 }, cors);
      }
      if (!env.AI) {
        return json({ error: 'AI binding missing — check wrangler.toml [ai] block' }, { status: 500 }, cors);
      }

      try {
        const result = await generate(env, prompt.trim(), count);
        if (!result.generations.length) {
          return json({
            error: 'All generations failed',
            failures: result.failures
          }, { status: 502 }, cors);
        }
        return json(result, {}, cors);
      } catch (err) {
        return json({ error: err?.message || String(err) }, { status: 500 }, cors);
      }
    }

    return json({ error: 'Not found', path: url.pathname }, { status: 404 }, cors);
  },
};
