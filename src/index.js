/**
 * Crystal Brook — storefront + catalogue API Worker
 *
 * One Worker handles two responsibilities:
 *
 *   1. /api/* routes — read/write the product catalogue from D1.
 *      The storefront fetches GET /api/products on load. Admin saves
 *      go via PUT /api/products/:id, gated by the X-Admin-Password
 *      header (compared against the ADMIN_PASSWORD secret).
 *
 *   2. Everything else — fall through to the static asset bundle
 *      (Workers Static Assets) which serves the HTML/CSS/JS/images
 *      that the storefront and admin pages are built from.
 *
 * Auth is deliberately simple: a single shared password held as a
 * Worker secret, sent as an X-Admin-Password header on writes. Good
 * enough for a one-and-a-half-person craft business; can swap for
 * Cloudflare Access if Max ever needs multi-user permissions.
 */

const PRODUCT_FIELDS = [
  'id', 'name', 'cat', 'price', 'size', 'image', 'pimg', 'badge',
  'meta', 'description', 'gallery', 'draft', 'sort_order',
];

// Fields the admin is allowed to update (id is immutable post-create)
const UPDATABLE_FIELDS = [
  'name', 'cat', 'price', 'size', 'image', 'pimg', 'badge',
  'meta', 'description', 'gallery', 'draft', 'sort_order',
];

const VALID_CATS = new Set(['saltwater', 'freshwater', 'cars', 'animals', 'birds', 'montages']);


// -------- helpers --------

function jsonResponse(data, init = {}) {
  return new Response(JSON.stringify(data), {
    status: init.status || 200,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      ...(init.headers || {}),
    },
  });
}

function errorResponse(message, status = 400) {
  return jsonResponse({ error: message }, { status });
}

function rowToProduct(row) {
  // D1 returns SQL nulls as JS nulls; gallery is stored as JSON text.
  let gallery = null;
  if (row.gallery) {
    try { gallery = JSON.parse(row.gallery); } catch (_) { gallery = null; }
  }
  return {
    id: row.id,
    name: row.name,
    cat: row.cat,
    price: row.price,
    size: row.size,
    image: row.image,
    pimg: row.pimg,
    badge: row.badge,
    meta: row.meta,
    desc: row.description,             // storefront uses `desc` not `description`
    gallery,
    draft: !!row.draft,
    sortOrder: row.sort_order,
  };
}

function constantTimeEqualString(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function bytesToHex(bytes) {
  return [...bytes].map(b => b.toString(16).padStart(2, '0')).join('');
}

async function pbkdf2Hash(password, salt) {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits'],
  );
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: enc.encode(salt), iterations: 100000, hash: 'SHA-256' },
    keyMaterial,
    256,
  );
  return bytesToHex(new Uint8Array(bits));
}

async function isAuthorised(request, env) {
  const sent = request.headers.get('x-admin-password');
  if (!sent) return false;

  // Two valid credentials, either grants access:
  //   1. env.ADMIN_PASSWORD — the developer master, set via
  //      `wrangler secret put ADMIN_PASSWORD`. Never changes when Max
  //      rotates his password from inside the admin UI, so Steve can
  //      always get back in to debug or reset things.
  //   2. The PBKDF2 hash in admin_password (id=1) — Max's user-rotatable
  //      password, set/changed from Settings → Admin password.
  // Both are checked on every auth so neither side can lock the other out.
  const master = env.ADMIN_PASSWORD;
  if (master && constantTimeEqualString(sent, master)) return true;

  const row = await env.DB.prepare(
    'SELECT hash, salt FROM admin_password WHERE id = 1'
  ).first();
  if (row && row.hash && row.salt) {
    const computed = await pbkdf2Hash(sent, row.salt);
    if (constantTimeEqualString(computed, row.hash)) return true;
  }

  return false;
}

function validateProductPatch(patch) {
  const errors = [];
  if ('cat' in patch && !VALID_CATS.has(patch.cat)) errors.push('cat must be one of ' + [...VALID_CATS].join(', '));
  if ('price' in patch) {
    const p = Number(patch.price);
    if (!Number.isFinite(p) || p < 0 || p > 100000) errors.push('price must be a non-negative number under 100000');
  }
  if ('draft' in patch && typeof patch.draft !== 'boolean' && patch.draft !== 0 && patch.draft !== 1) {
    errors.push('draft must be a boolean');
  }
  if ('gallery' in patch && patch.gallery !== null && !Array.isArray(patch.gallery)) {
    errors.push('gallery must be an array or null');
  }
  for (const k of Object.keys(patch)) {
    if (!UPDATABLE_FIELDS.includes(k)) errors.push(`unknown field "${k}"`);
  }
  return errors;
}


// -------- route handlers --------

async function handleGetProducts(request, env) {
  const url = new URL(request.url);
  const includeDrafts = url.searchParams.get('drafts') === '1';
  const cat = url.searchParams.get('cat');

  let sql = `SELECT * FROM products`;
  const where = [];
  const params = [];
  if (!includeDrafts) where.push('draft = 0');
  if (cat) { where.push('cat = ?'); params.push(cat); }
  if (where.length) sql += ' WHERE ' + where.join(' AND ');
  sql += ' ORDER BY cat, sort_order, name';

  const result = await env.DB.prepare(sql).bind(...params).all();
  return jsonResponse({ products: result.results.map(rowToProduct) });
}

async function handleGetProduct(request, env, id) {
  const row = await env.DB.prepare('SELECT * FROM products WHERE id = ?').bind(id).first();
  if (!row) return errorResponse('not found', 404);
  return jsonResponse({ product: rowToProduct(row) });
}

async function handleUpdateProduct(request, env, id) {
  if (!await isAuthorised(request, env)) return errorResponse('unauthorised', 401);

  let body;
  try { body = await request.json(); }
  catch (_) { return errorResponse('invalid JSON body'); }
  if (!body || typeof body !== 'object') return errorResponse('expected an object body');

  const errors = validateProductPatch(body);
  if (errors.length) return errorResponse(errors.join('; '));

  const existing = await env.DB.prepare('SELECT id FROM products WHERE id = ?').bind(id).first();
  if (!existing) return errorResponse('not found', 404);

  const sets = [];
  const params = [];
  for (const [k, v] of Object.entries(body)) {
    if (!UPDATABLE_FIELDS.includes(k)) continue;
    if (k === 'gallery') {
      sets.push(`gallery = ?`);
      params.push(v ? JSON.stringify(v) : null);
    } else if (k === 'draft') {
      sets.push(`draft = ?`);
      params.push(v ? 1 : 0);
    } else {
      sets.push(`${k} = ?`);
      params.push(v);
    }
  }
  if (!sets.length) return errorResponse('no updatable fields supplied');

  sets.push(`updated_at = datetime('now')`);

  const sql = `UPDATE products SET ${sets.join(', ')} WHERE id = ?`;
  params.push(id);
  await env.DB.prepare(sql).bind(...params).run();

  const row = await env.DB.prepare('SELECT * FROM products WHERE id = ?').bind(id).first();
  return jsonResponse({ product: rowToProduct(row) });
}

async function handleCreateProduct(request, env) {
  if (!await isAuthorised(request, env)) return errorResponse('unauthorised', 401);

  let body;
  try { body = await request.json(); }
  catch (_) { return errorResponse('invalid JSON body'); }

  const required = ['id', 'name', 'cat', 'price', 'size', 'image', 'description'];
  const missing = required.filter(k => !body[k]);
  if (missing.length) return errorResponse(`missing required fields: ${missing.join(', ')}`);

  // Re-use the patch validator for the optional fields
  const errors = validateProductPatch(body);
  if (errors.filter(e => !e.startsWith('unknown field "id"') && !e.startsWith('unknown field "description"')).length) {
    return errorResponse(errors.join('; '));
  }

  const dup = await env.DB.prepare('SELECT id FROM products WHERE id = ?').bind(body.id).first();
  if (dup) return errorResponse(`product id "${body.id}" already exists`, 409);

  await env.DB.prepare(`
    INSERT INTO products (id, name, cat, price, size, image, pimg, badge, meta, description, gallery, draft, sort_order)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    body.id,
    body.name,
    body.cat,
    body.price,
    body.size,
    body.image,
    body.pimg ?? null,
    body.badge ?? null,
    body.meta ?? null,
    body.description,
    body.gallery ? JSON.stringify(body.gallery) : null,
    body.draft ? 1 : 0,
    body.sort_order ?? 100,
  ).run();

  const row = await env.DB.prepare('SELECT * FROM products WHERE id = ?').bind(body.id).first();
  return jsonResponse({ product: rowToProduct(row) }, { status: 201 });
}

async function handleDeleteProduct(request, env, id) {
  if (!await isAuthorised(request, env)) return errorResponse('unauthorised', 401);
  const result = await env.DB.prepare('DELETE FROM products WHERE id = ?').bind(id).run();
  if (!result.meta.changes) return errorResponse('not found', 404);
  return jsonResponse({ deleted: id });
}

async function handleAdminCheck(request, env) {
  // Admin sends the password as a header and we just say yes/no — used by
  // the admin login screen so we can confirm before storing in localStorage.
  return (await isAuthorised(request, env))
    ? jsonResponse({ ok: true })
    : errorResponse('unauthorised', 401);
}

async function handleChangePassword(request, env) {
  if (!await isAuthorised(request, env)) return errorResponse('unauthorised', 401);

  let body;
  try { body = await request.json(); }
  catch (_) { return errorResponse('invalid JSON body'); }
  const newPw = body && typeof body.newPassword === 'string' ? body.newPassword : '';
  if (newPw.length < 8)  return errorResponse('newPassword must be at least 8 characters');
  if (newPw.length > 200) return errorResponse('newPassword too long');

  // Fresh 16-byte salt per rotation
  const saltBytes = crypto.getRandomValues(new Uint8Array(16));
  const salt = bytesToHex(saltBytes);
  const hash = await pbkdf2Hash(newPw, salt);

  await env.DB.prepare(`
    INSERT INTO admin_password (id, hash, salt, updated_at)
    VALUES (1, ?, ?, datetime('now'))
    ON CONFLICT(id) DO UPDATE SET
      hash = excluded.hash,
      salt = excluded.salt,
      updated_at = excluded.updated_at
  `).bind(hash, salt).run();

  return jsonResponse({ ok: true });
}


// -------- /api/content (site copy: about page bio, etc) --------

async function handleGetContent(request, env) {
  const result = await env.DB.prepare('SELECT key, value FROM site_content').all();
  const content = {};
  for (const row of result.results) content[row.key] = row.value;
  return jsonResponse({ content });
}

async function handlePutContent(request, env, key) {
  if (!await isAuthorised(request, env)) return errorResponse('unauthorised', 401);
  if (!/^[a-z][a-z0-9_]*$/.test(key)) return errorResponse('invalid key');

  let body;
  try { body = await request.json(); }
  catch (_) { return errorResponse('invalid JSON body'); }
  if (!body || typeof body.value !== 'string') {
    return errorResponse('expected { value: string }');
  }
  if (body.value.length > 8000) {
    return errorResponse('value too long (max 8000 chars)');
  }

  // Upsert — common case is editing existing content, but allow new keys
  await env.DB.prepare(`
    INSERT INTO site_content (key, value, updated_at)
    VALUES (?, ?, datetime('now'))
    ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')
  `).bind(key, body.value).run();

  return jsonResponse({ key, value: body.value });
}


// -------- /api/requests (quote / commission requests from the public site) --------

const REQUEST_FIELDS = ['id','name','email','phone','subject','category','size','notes','photo_data_url','status','source','created_at'];
const VALID_REQUEST_STATUSES = new Set(['new','quoted','in_progress','done','declined']);

function rowToRequest(row) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    subject: row.subject,
    category: row.category,
    size: row.size,
    notes: row.notes,
    photoDataUrl: row.photo_data_url,
    status: row.status,
    source: row.source,
    createdAt: row.created_at,
  };
}

async function handleCreateRequest(request, env) {
  let body;
  try { body = await request.json(); }
  catch (_) { return errorResponse('invalid JSON body'); }

  const name    = (body.name    || '').toString().trim();
  const email   = (body.email   || '').toString().trim();
  const phone   = (body.phone   || '').toString().trim().slice(0, 50) || null;
  const subject = (body.subject || '').toString().trim();
  const category = (body.category || '').toString().trim().slice(0, 32) || null;
  const size    = (body.size    || '').toString().trim().slice(0, 32) || null;
  const notes   = (body.notes   || '').toString().slice(0, 4000) || null;
  const source  = (body.source  || 'unknown').toString().trim().slice(0, 32);
  const photo   = (body.photoDataUrl || '').toString();

  if (!name || name.length > 200)   return errorResponse('name required (≤ 200 chars)');
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return errorResponse('valid email required');
  if (!subject || subject.length > 1000) return errorResponse('subject required (≤ 1000 chars)');

  // Photo size cap — request body in D1 must fit; 800KB data URL is plenty
  // for a 1024px JPEG reference, and below the 1MB row limit.
  let photoDataUrl = null;
  if (photo) {
    if (!photo.startsWith('data:image/')) return errorResponse('photo must be a data URL');
    if (photo.length > 800_000) return errorResponse('photo too large (please re-attach a smaller one)');
    photoDataUrl = photo;
  }

  const id = 'REQ-' + Math.random().toString(36).slice(2, 8).toUpperCase() + Date.now().toString(36).toUpperCase().slice(-4);

  await env.DB.prepare(`
    INSERT INTO requests (id, name, email, phone, subject, category, size, notes, photo_data_url, status, source)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'new', ?)
  `).bind(id, name, email, phone, subject, category, size, notes, photoDataUrl, source).run();

  return jsonResponse({ ok: true, id });
}

async function handleListRequests(request, env) {
  if (!await isAuthorised(request, env)) return errorResponse('unauthorised', 401);
  const result = await env.DB.prepare(
    'SELECT * FROM requests ORDER BY created_at DESC LIMIT 200'
  ).all();
  return jsonResponse({ requests: (result.results || []).map(rowToRequest) });
}

async function handleUpdateRequestStatus(request, env, id) {
  if (!await isAuthorised(request, env)) return errorResponse('unauthorised', 401);
  let body;
  try { body = await request.json(); }
  catch (_) { return errorResponse('invalid JSON body'); }
  const status = (body.status || '').toString().trim();
  if (!VALID_REQUEST_STATUSES.has(status)) return errorResponse('invalid status');
  const res = await env.DB.prepare(
    'UPDATE requests SET status = ? WHERE id = ?'
  ).bind(status, id).run();
  if (!res.meta || !res.meta.changes) return errorResponse('not found', 404);
  return jsonResponse({ ok: true, id, status });
}

async function handleDeleteRequest(request, env, id) {
  if (!await isAuthorised(request, env)) return errorResponse('unauthorised', 401);
  const res = await env.DB.prepare('DELETE FROM requests WHERE id = ?').bind(id).run();
  if (!res.meta || !res.meta.changes) return errorResponse('not found', 404);
  return jsonResponse({ ok: true, id });
}


// -------- /api/orders (confirmed orders, customer + admin) --------

const VALID_ORDER_STATUSES = new Set(['paid','in_production','shipped','delivered','refunded','cancelled']);

function rowToOrder(row) {
  let items = [];
  try { items = JSON.parse(row.items || '[]'); } catch (_) { items = []; }
  return {
    id:        row.id,
    name:      row.name,
    email:     row.email,
    phone:     row.phone,
    address:   row.address,
    suburb:    row.suburb,
    state:     row.state,
    postcode:  row.postcode,
    items,
    subtotal:  row.subtotal,
    shipping:  row.shipping,
    total:     row.total,
    status:    row.status,
    paymentRef: row.payment_ref,
    source:    row.source,
    notes:     row.notes,
    photoDataUrl: row.photo_data_url,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function handleCreateOrder(request, env) {
  // Public route — allowed without admin auth (the customer is checking out).
  // Admin-flagged ('manual_admin' source) calls add the X-Admin-Password header
  // and bypass any future rate-limiting we add.
  let body;
  try { body = await request.json(); }
  catch (_) { return errorResponse('invalid JSON body'); }

  const name     = (body.name     || '').toString().trim().slice(0, 200);
  const email    = (body.email    || '').toString().trim().slice(0, 200);
  const phone    = (body.phone    || '').toString().trim().slice(0, 50) || null;
  const address  = (body.address  || '').toString().trim().slice(0, 300) || null;
  const suburb   = (body.suburb   || '').toString().trim().slice(0, 100) || null;
  const state    = (body.state    || '').toString().trim().slice(0, 8)  || null;
  const postcode = (body.postcode || '').toString().trim().slice(0, 16) || null;
  const items    = Array.isArray(body.items) ? body.items : [];
  const source   = (body.source   || 'checkout').toString().slice(0, 32);
  const notes    = (body.notes    || '').toString().slice(0, 4000) || null;
  const photo    = (body.photoDataUrl || '').toString();

  if (!name) return errorResponse('name required');
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return errorResponse('valid email required');
  if (!items.length) return errorResponse('at least one item required');

  // Recompute totals server-side from the line items so a tampered client
  // can't post a $1 total for $1000 of products. shipping defaults to free.
  let subtotal = 0;
  const cleanItems = items.map(it => {
    const price = Number(it.price) || 0;
    const qty   = Math.max(1, Math.min(20, Number(it.qty) || 1));
    subtotal += price * qty;
    return { id: String(it.id || ''), name: String(it.name || ''), price, qty };
  });
  const shipping = Number(body.shipping) || 0;
  const total = subtotal + shipping;

  let photoDataUrl = null;
  if (photo) {
    if (!photo.startsWith('data:image/')) return errorResponse('photo must be a data URL');
    if (photo.length > 800_000) return errorResponse('photo too large');
    photoDataUrl = photo;
  }

  // Sequential ID — count existing rows + 1, prefixed CB-. Not collision-proof
  // under heavy concurrency but fine for a one-and-a-half-person workshop.
  const countRow = await env.DB.prepare('SELECT COUNT(*) AS n FROM orders').first();
  const seq = ((countRow && countRow.n) || 0) + 1;
  const id = 'CB-' + String(seq).padStart(6, '0');

  await env.DB.prepare(`
    INSERT INTO orders (id, name, email, phone, address, suburb, state, postcode,
      items, subtotal, shipping, total, status, source, notes, photo_data_url)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(id, name, email, phone, address, suburb, state, postcode,
    JSON.stringify(cleanItems), subtotal, shipping, total,
    source === 'manual_admin' ? 'paid' : 'paid',  // assume paid on submit; admin can change
    source, notes, photoDataUrl).run();

  return jsonResponse({ ok: true, id, total });
}

async function handleListOrders(request, env) {
  if (!await isAuthorised(request, env)) return errorResponse('unauthorised', 401);
  const result = await env.DB.prepare(
    'SELECT * FROM orders ORDER BY created_at DESC LIMIT 200'
  ).all();
  return jsonResponse({ orders: (result.results || []).map(rowToOrder) });
}

async function handleGetOrder(request, env, id) {
  // Public — but only returns basic fields needed for the order tracking page.
  const row = await env.DB.prepare('SELECT * FROM orders WHERE id = ?').bind(id).first();
  if (!row) return errorResponse('not found', 404);
  // For non-admin callers, hide the email/address — they'd need to be on the
  // tracking-link landing page typed in by the customer with their order id.
  const order = rowToOrder(row);
  if (!await isAuthorised(request, env)) {
    return jsonResponse({ order: {
      id: order.id, items: order.items, subtotal: order.subtotal,
      shipping: order.shipping, total: order.total, status: order.status,
      createdAt: order.createdAt,
    }});
  }
  return jsonResponse({ order });
}

async function handleUpdateOrderStatus(request, env, id) {
  if (!await isAuthorised(request, env)) return errorResponse('unauthorised', 401);
  let body;
  try { body = await request.json(); }
  catch (_) { return errorResponse('invalid JSON body'); }
  const status = (body.status || '').toString().trim();
  if (!VALID_ORDER_STATUSES.has(status)) return errorResponse('invalid status');
  const res = await env.DB.prepare(
    'UPDATE orders SET status = ?, updated_at = datetime(\'now\') WHERE id = ?'
  ).bind(status, id).run();
  if (!res.meta || !res.meta.changes) return errorResponse('not found', 404);
  return jsonResponse({ ok: true, id, status });
}

async function handleDeleteOrder(request, env, id) {
  if (!await isAuthorised(request, env)) return errorResponse('unauthorised', 401);
  const res = await env.DB.prepare('DELETE FROM orders WHERE id = ?').bind(id).run();
  if (!res.meta || !res.meta.changes) return errorResponse('not found', 404);
  return jsonResponse({ ok: true, id });
}


// -------- main fetch handler --------

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    // API routes
    if (path.startsWith('/api/')) {
      try {
        if (path === '/api/products' && request.method === 'GET') {
          return await handleGetProducts(request, env);
        }
        if (path === '/api/products' && request.method === 'POST') {
          return await handleCreateProduct(request, env);
        }
        const idMatch = path.match(/^\/api\/products\/([\w-]+)$/);
        if (idMatch) {
          const id = idMatch[1];
          if (request.method === 'GET') return await handleGetProduct(request, env, id);
          if (request.method === 'PUT') return await handleUpdateProduct(request, env, id);
          if (request.method === 'DELETE') return await handleDeleteProduct(request, env, id);
        }
        if (path === '/api/admin/check' && request.method === 'POST') {
          return await handleAdminCheck(request, env);
        }
        if (path === '/api/admin/password' && request.method === 'POST') {
          return await handleChangePassword(request, env);
        }
        if (path === '/api/content' && request.method === 'GET') {
          return await handleGetContent(request, env);
        }
        const contentMatch = path.match(/^\/api\/content\/([a-z][a-z0-9_]*)$/);
        if (contentMatch && request.method === 'PUT') {
          return await handlePutContent(request, env, contentMatch[1]);
        }
        if (path === '/api/requests' && request.method === 'POST') {
          return await handleCreateRequest(request, env);
        }
        if (path === '/api/requests' && request.method === 'GET') {
          return await handleListRequests(request, env);
        }
        const reqMatch = path.match(/^\/api\/requests\/([\w-]+)$/);
        if (reqMatch) {
          const id = reqMatch[1];
          if (request.method === 'PATCH')  return await handleUpdateRequestStatus(request, env, id);
          if (request.method === 'DELETE') return await handleDeleteRequest(request, env, id);
        }
        if (path === '/api/orders' && request.method === 'POST') {
          return await handleCreateOrder(request, env);
        }
        if (path === '/api/orders' && request.method === 'GET') {
          return await handleListOrders(request, env);
        }
        const ordMatch = path.match(/^\/api\/orders\/([\w-]+)$/);
        if (ordMatch) {
          const id = ordMatch[1];
          if (request.method === 'GET')    return await handleGetOrder(request, env, id);
          if (request.method === 'PATCH')  return await handleUpdateOrderStatus(request, env, id);
          if (request.method === 'DELETE') return await handleDeleteOrder(request, env, id);
        }
        return errorResponse('not found', 404);
      } catch (err) {
        console.error('API error', err);
        return errorResponse('internal error', 500);
      }
    }

    // Anything else — fall through to the static asset bundle
    if (env.ASSETS && typeof env.ASSETS.fetch === 'function') {
      return env.ASSETS.fetch(request);
    }
    return new Response('Not configured', { status: 500 });
  },
};
