/**
 * Generate logo variants via the Image Builder Worker.
 *
 * Calls the deployed Worker with 4 different logo prompts, each in
 * Max's preferred heritage emblem style (gold-on-warm-black, vintage
 * steel-engraving aesthetic). Saves the first returned image of each
 * batch as a PNG into assets/logos/.
 *
 * Usage:  node generate-logos.mjs
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..', '..');
const OUT_DIR = path.join(REPO_ROOT, 'assets', 'logos');

const WORKER = 'https://crystalbrook-image-builder.steve-700.workers.dev/api/studio/generate';

// Each variant is the SAME heritage emblem language (gold-on-black, etched
// bass, serif typography) — only the FRAME shape changes. This keeps all
// variants in the same family as Max's V1 pick rather than radical departures.
const VARIANTS = [
  {
    slug: 'v2-hexagon',
    name: 'Refined Hexagon',
    prompt:
      "Vintage logo emblem in steel-engraving etching style, hexagonal frame with elegant double gold border line, " +
      "detailed engraved largemouth bass fish in side profile mid-strike with intricate scale and fin ray detail and gaping mouth, " +
      "'CRYSTAL BROOK' in elegant serif typography (large caps) centered across the body of the emblem, " +
      "'WALL MOUNTS' in letter-spaced smaller caps below, " +
      "small 'EST. 2024' caps on either side flanking the wordmark, " +
      "'HANDCRAFTED IN QUEENSLAND' curving along the bottom of the hexagon with a small Australia silhouette, " +
      "warm metallic gold and copper engraving on a deep warm-black background, " +
      "premium heritage brand mark, vintage apothecary aesthetic, no shadow, sharp 8k detail, no signature, no watermark",
  },
  {
    slug: 'v3-oval',
    name: 'Oval Crest',
    prompt:
      "Vintage logo emblem in steel-engraving etching style, vertical oval frame with intricate gold border ornaments at top and bottom, " +
      "detailed engraved largemouth bass fish in side profile facing right with intricate scale and fin detail centered inside the oval, " +
      "'CRYSTAL BROOK' in classic serif typography arched along the top of the oval, " +
      "'WALL MOUNTS' in letter-spaced caps along the bottom curve of the oval, " +
      "small 'EST. 2024' decorative scrollwork between, " +
      "warm metallic gold and copper engraving on a deep warm-black background, " +
      "premium heritage brand mark, vintage badge, no shadow, sharp 8k detail, no signature, no watermark",
  },
  {
    slug: 'v4-roundel',
    name: 'Circular Roundel',
    prompt:
      "Vintage circular emblem logo in steel-engraving etching style, double concentric gold ring frame, " +
      "detailed engraved largemouth bass fish in side profile facing right with intricate scale and fin detail centered inside the inner ring, " +
      "'CRYSTAL BROOK' curved along the top of the inner ring in elegant serif caps, " +
      "'WALL MOUNTS' curved along the bottom of the inner ring in letter-spaced caps, " +
      "small dot separators at the 9 o'clock and 3 o'clock positions, " +
      "small 'EST. 2024' caps in a tiny scroll banner at the very bottom, " +
      "warm metallic gold and copper engraving on a deep warm-black background, " +
      "premium heritage brand seal, vintage apothecary aesthetic, no shadow, sharp 8k detail, no signature, no watermark",
  },
  {
    slug: 'v5-shield',
    name: 'Heraldic Shield',
    prompt:
      "Vintage shield emblem logo in steel-engraving etching style, ornate heraldic shield frame with gold border flourishes and decorative scrollwork at the top, " +
      "detailed engraved largemouth bass fish swimming across the center of the shield with intricate scale and fin detail, " +
      "'CRYSTAL BROOK' on a curved banner ribbon arched across the top of the shield, " +
      "'WALL MOUNTS' carved at the bottom of the shield in serif caps, " +
      "small 'EST. 2024' caps in decorative side scrolls, " +
      "'HANDCRAFTED IN QUEENSLAND' on a small banner ribbon below the shield, " +
      "warm metallic gold and copper engraving on a deep warm-black background, " +
      "premium heritage brand crest, vintage heraldic emblem, no shadow, sharp 8k detail, no signature, no watermark",
  },
];

async function generate(variant) {
  console.log(`[${variant.slug}] requesting…`);
  const startedAt = Date.now();

  const res = await fetch(WORKER, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Origin': 'https://3dhuboz.github.io' },
    body: JSON.stringify({ prompt: variant.prompt, count: 3 }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`[${variant.slug}] HTTP ${res.status}: ${text.slice(0, 300)}`);
  }
  const data = await res.json();
  if (!data.generations?.length) {
    throw new Error(`[${variant.slug}] no generations returned: ${JSON.stringify(data).slice(0, 300)}`);
  }

  // Save up to 3 candidates — Max can pick the best of each set later.
  const written = [];
  for (let i = 0; i < data.generations.length; i++) {
    const gen = data.generations[i];
    const dataUrl = gen.url || '';
    const m = dataUrl.match(/^data:(image\/[a-z]+);base64,(.+)$/);
    if (!m) {
      console.warn(`[${variant.slug}] candidate ${i} missing/invalid data URL`);
      continue;
    }
    const ext = m[1] === 'image/jpeg' ? 'jpg' : 'png';
    const buf = Buffer.from(m[2], 'base64');
    const filename = i === 0 ? `${variant.slug}.${ext}` : `${variant.slug}-alt${i}.${ext}`;
    const filePath = path.join(OUT_DIR, filename);
    await fs.writeFile(filePath, buf);
    written.push(filename);
  }

  const elapsed = ((Date.now() - startedAt) / 1000).toFixed(1);
  console.log(`[${variant.slug}] saved ${written.length} candidate(s) in ${elapsed}s — ${written.join(', ')}`);
  return { slug: variant.slug, candidates: written };
}

async function main() {
  await fs.mkdir(OUT_DIR, { recursive: true });
  console.log(`Generating ${VARIANTS.length} logo variants → ${OUT_DIR}\n`);

  // Run all 4 in parallel — the Worker handles them concurrently and FLUX
  // schnell on Workers AI is fast (~5-10s per 3-image batch).
  const results = await Promise.allSettled(VARIANTS.map(generate));

  console.log('\n--- summary ---');
  for (let i = 0; i < results.length; i++) {
    const v = VARIANTS[i];
    const r = results[i];
    if (r.status === 'fulfilled') {
      console.log(`OK  ${v.slug} → ${r.value.candidates.length} files`);
    } else {
      console.log(`ERR ${v.slug}: ${r.reason?.message || r.reason}`);
    }
  }
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
