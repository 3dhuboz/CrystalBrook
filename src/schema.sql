-- Crystal Brook Wall Mounts — D1 schema
-- One table per concept. Keep it boring.

CREATE TABLE IF NOT EXISTS products (
  id          TEXT PRIMARY KEY,        -- e.g. 'p-coral'
  name        TEXT NOT NULL,           -- 'Coral Trout'
  cat         TEXT NOT NULL,           -- 'saltwater' | 'freshwater' | 'cars' | 'animals' | 'birds' | 'montages'
  price       INTEGER NOT NULL,        -- in dollars (no cents — Max prices in whole dollars)
  size        TEXT NOT NULL,           -- '68 × 32 cm'
  image       TEXT NOT NULL,           -- 'assets/images/products/coral-trout-vivid.png'
  pimg        TEXT,                    -- placeholder-image CSS class (optional)
  badge       TEXT,                    -- 'Bestseller' | 'Signature' | 'New' | NULL
  meta        TEXT,                    -- 'Great Barrier Reef · Silky Oak mount'
  description TEXT NOT NULL,           -- the long blurb
  gallery     TEXT,                    -- JSON array of {src, alt, label} or NULL
  draft       INTEGER NOT NULL DEFAULT 0,  -- 0 = visible on storefront, 1 = hidden
  sort_order  INTEGER NOT NULL DEFAULT 100, -- lower = earlier in catalog listings
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_products_cat       ON products(cat);
CREATE INDEX IF NOT EXISTS idx_products_draft     ON products(draft);
CREATE INDEX IF NOT EXISTS idx_products_sort      ON products(cat, sort_order);


-- Site content (About page bio, contact text, anything else Max needs to
-- self-edit without a redeploy). Key/value pairs — keep it boring.
CREATE TABLE IF NOT EXISTS site_content (
  key        TEXT PRIMARY KEY,         -- e.g. 'about_lede', 'about_story_p1'
  value      TEXT NOT NULL,            -- the actual copy (plain text)
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);


-- Admin password (rotated by Max from inside the admin UI).
-- One row, id = 1. PBKDF2/SHA-256 hash with a per-rotation salt.
-- Until a row exists, the Worker falls back to env.ADMIN_PASSWORD as a
-- bootstrap; once Max rotates, that fallback is no longer accepted.
-- Recovery: `wrangler d1 execute crystalbrook --remote --command='DELETE FROM admin_password'`
-- restores the env-secret bootstrap.
CREATE TABLE IF NOT EXISTS admin_password (
  id         INTEGER PRIMARY KEY,
  hash       TEXT NOT NULL,
  salt       TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
