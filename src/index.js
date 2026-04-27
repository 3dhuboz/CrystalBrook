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

function isAuthorised(request, env) {
  const sent = request.headers.get('x-admin-password');
  const expected = env.ADMIN_PASSWORD;
  if (!expected) return false;          // misconfigured worker → deny by default
  if (!sent) return false;
  // constant-time compare to avoid timing leaks (small but good habit)
  if (sent.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < sent.length; i++) diff |= sent.charCodeAt(i) ^ expected.charCodeAt(i);
  return diff === 0;
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
  if (!isAuthorised(request, env)) return errorResponse('unauthorised', 401);

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
  if (!isAuthorised(request, env)) return errorResponse('unauthorised', 401);

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
  if (!isAuthorised(request, env)) return errorResponse('unauthorised', 401);
  const result = await env.DB.prepare('DELETE FROM products WHERE id = ?').bind(id).run();
  if (!result.meta.changes) return errorResponse('not found', 404);
  return jsonResponse({ deleted: id });
}

async function handleAdminCheck(request, env) {
  // Admin sends the password as a header and we just say yes/no — used by
  // the admin login screen so we can confirm before storing in localStorage.
  return isAuthorised(request, env)
    ? jsonResponse({ ok: true })
    : errorResponse('unauthorised', 401);
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
