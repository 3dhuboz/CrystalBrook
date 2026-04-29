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
-- The Worker accepts EITHER this hash OR the env.ADMIN_PASSWORD secret
-- (Steve's developer master password). Max changing his password
-- through the UI only updates this row — never the env secret — so
-- Steve always retains a fallback to fix things if Max forgets his
-- password or locks himself out.
-- Recovery (clear Max's password back to no-row state):
--   wrangler d1 execute crystalbrook --remote --command='DELETE FROM admin_password'
CREATE TABLE IF NOT EXISTS admin_password (
  id         INTEGER PRIMARY KEY,
  hash       TEXT NOT NULL,
  salt       TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);


-- Quote / commission requests submitted from the public site (the form
-- on about.html#contact and the request-a-piece modal on shop.html).
-- Public POST writes a row; admin GET reads them all back into the
-- Custom Orders kanban. photo_data_url holds an optional reference image
-- the customer pasted in (NOT a photo to print from — Max prints from
-- the *idea*; the picture is just to help him understand what they want).
CREATE TABLE IF NOT EXISTS requests (
  id              TEXT PRIMARY KEY,        -- 'REQ-1A2B3C…'
  name            TEXT NOT NULL,
  email           TEXT NOT NULL,
  phone           TEXT,
  subject         TEXT NOT NULL,           -- what they want a piece of
  category        TEXT,                    -- saltwater | freshwater | cars | … | other
  size            TEXT,                    -- small | medium | large | xl | ''
  notes           TEXT,
  photo_data_url  TEXT,                    -- optional reference image (data:image/…)
  status          TEXT NOT NULL DEFAULT 'new',  -- new | quoted | in_progress | done | declined
  source          TEXT,                    -- 'about_contact' | 'shop_request' | 'product_page'
  created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_requests_created ON requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_requests_status  ON requests(status);


-- Confirmed orders. Created by the storefront checkout flow (POST /api/orders)
-- and by the admin "+ Manual order" form. Each row stores the line items as
-- JSON in the items column — no separate order_items table because the
-- storefront cart is small (typically 1-3 pieces) and pieces are immutable
-- once an order is placed.
CREATE TABLE IF NOT EXISTS orders (
  id            TEXT PRIMARY KEY,        -- 'CB-001234'
  name          TEXT NOT NULL,
  email         TEXT NOT NULL,
  phone         TEXT,
  address       TEXT,                    -- street address (one line)
  suburb        TEXT,
  state         TEXT,                    -- QLD | NSW | … | NT
  postcode      TEXT,
  items         TEXT NOT NULL,           -- JSON: [{id, name, price, qty}]
  subtotal      INTEGER NOT NULL,        -- whole AUD
  shipping      INTEGER NOT NULL DEFAULT 0,
  total         INTEGER NOT NULL,
  status        TEXT NOT NULL DEFAULT 'paid',  -- paid | in_production | shipped | delivered | refunded | cancelled
  payment_ref   TEXT,                    -- Stripe charge id when wired
  source        TEXT,                    -- 'checkout' | 'manual_admin'
  notes         TEXT,                    -- admin-only notes (used for manual orders)
  photo_data_url TEXT,                   -- optional reference for manual orders
  tracking_number TEXT,                  -- e.g. Aus Post tracking; included in shipped-status email
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_status  ON orders(status);
