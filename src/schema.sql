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
