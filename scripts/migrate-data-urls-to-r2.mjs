#!/usr/bin/env node
/* One-off migration: walk every product, find any image / gallery[].src
 * that's a base64 data URL, push the binary to R2, and rewrite D1 to
 * use the resulting /uploads/<key> URL. Drops /api/products from
 * ~50MB to <50KB so the storefront stops flashing stale data on load.
 *
 * Usage:  node scripts/migrate-data-urls-to-r2.mjs
 *
 * Idempotent — already-migrated rows are skipped.
 *
 * Bypasses the admin-auth gate entirely by going through `wrangler d1`
 * and `wrangler r2 object put` directly, so it doesn't need the
 * X-Admin-Password header. Run from the worktree root. Requires
 * wrangler to be logged in to the Cloudflare account that owns the
 * `crystalbrook` worker / `crystalbrook-uploads` bucket.
 */
import { execSync } from 'node:child_process';
import { writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomBytes } from 'node:crypto';

const D1_DB = 'crystalbrook';
const R2_BUCKET = 'crystalbrook-uploads';
const CONFIG = './wrangler.toml';

function sh(cmd, opts = {}) {
  return execSync(cmd, { encoding: 'utf-8', stdio: opts.silent ? ['pipe','pipe','pipe'] : 'inherit', ...opts });
}

function d1(sql) {
  // Use --json so we can parse the results. The output is a JSON array of
  // result-set objects (one per command).
  const out = execSync(
    `wrangler d1 execute ${D1_DB} --config ${CONFIG} --remote --json --command ${JSON.stringify(sql)}`,
    { encoding: 'utf-8', maxBuffer: 1024 * 1024 * 1024 },
  );
  // Wrangler prefixes some informational lines; the JSON starts at the first '['
  const start = out.indexOf('[');
  if (start < 0) throw new Error('no JSON in wrangler output:\n' + out.slice(0, 500));
  return JSON.parse(out.slice(start));
}

function escapeSqlString(s) {
  return "'" + String(s).replace(/'/g, "''") + "'";
}

function decodeDataUrl(dataUrl) {
  const m = /^data:([^;,]+)(?:;base64)?,(.*)$/s.exec(dataUrl);
  if (!m) throw new Error('not a data url');
  const mime = m[1].toLowerCase();
  const ext = ({
    'image/png': 'png', 'image/jpeg': 'jpg', 'image/jpg': 'jpg', 'image/webp': 'webp',
  })[mime] || 'bin';
  const buf = Buffer.from(m[2], 'base64');
  return { mime, ext, buf };
}

function uploadToR2(buf, mime, ext) {
  // wrangler r2 object put <bucket>/<key> --file <localfile> --content-type <mime>
  // Generate a random key matching the format the Worker uses.
  const key = `${Date.now().toString(36)}-${randomBytes(8).toString('hex').slice(0, 16)}.${ext}`;
  const tmpDir = mkdtempSync(join(tmpdir(), 'cb-migrate-'));
  const tmpFile = join(tmpDir, key);
  try {
    writeFileSync(tmpFile, buf);
    sh(
      `wrangler r2 object put ${R2_BUCKET}/${key} --config ${CONFIG} --remote --file ${JSON.stringify(tmpFile)} --content-type ${mime}`,
      { silent: true },
    );
    return `/uploads/${key}`;
  } finally {
    try { rmSync(tmpDir, { recursive: true, force: true }); } catch (_) {}
  }
}

console.log('▶ Reading products from D1…');
const result = d1('SELECT id, image, gallery FROM products');
const rows = result[0]?.results || [];
console.log(`  ${rows.length} products`);

let imagesMigrated = 0;
let galleryMigrated = 0;

for (const row of rows) {
  let newImage = row.image;
  let newGallery = row.gallery;
  let dirty = false;

  if (typeof row.image === 'string' && row.image.startsWith('data:')) {
    process.stdout.write(`  ${row.id} main image…`);
    const { mime, ext, buf } = decodeDataUrl(row.image);
    newImage = uploadToR2(buf, mime, ext);
    process.stdout.write(` → ${newImage} (${(buf.length / 1024).toFixed(0)} KB)\n`);
    imagesMigrated++;
    dirty = true;
  }

  if (row.gallery) {
    let parsed;
    try { parsed = JSON.parse(row.gallery); } catch (_) { parsed = null; }
    if (Array.isArray(parsed)) {
      let galleryDirty = false;
      for (let i = 0; i < parsed.length; i++) {
        const item = parsed[i];
        if (item && typeof item.src === 'string' && item.src.startsWith('data:')) {
          process.stdout.write(`  ${row.id} gallery[${i}]…`);
          const { mime, ext, buf } = decodeDataUrl(item.src);
          parsed[i] = { ...item, src: uploadToR2(buf, mime, ext) };
          process.stdout.write(` → ${parsed[i].src} (${(buf.length / 1024).toFixed(0)} KB)\n`);
          galleryMigrated++;
          galleryDirty = true;
        }
      }
      if (galleryDirty) {
        newGallery = JSON.stringify(parsed);
        dirty = true;
      }
    }
  }

  if (dirty) {
    const sql = `UPDATE products SET image = ${escapeSqlString(newImage)}, gallery = ${newGallery == null ? 'NULL' : escapeSqlString(newGallery)}, updated_at = datetime('now') WHERE id = ${escapeSqlString(row.id)}`;
    d1(sql);
  }
}

console.log(`\n✓ Migrated: ${imagesMigrated} main images, ${galleryMigrated} gallery items`);
