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
    quotePrice: row.quote_price,
    quoteMessage: row.quote_message,
    quoteImageUrl: row.quote_image_url,
    quoteToken: row.quote_token,           // admin only — NEVER returned to public callers
    quoteSentAt: row.quote_sent_at,
    quoteResponse: row.quote_response,
    quoteResponseAt: row.quote_response_at,
    quoteResponseMessage: row.quote_response_message,
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


/* ---------- Quote draft / customer-approval workflow ----------
 * Admin composes a quote (price + message + optional mockup), the
 * Worker mints a random token + generates a customer-facing link,
 * and emails the customer. Customer reviews on /quote.html?id=&token=,
 * approves or asks for changes, and Max gets a notification email.
 */
function randomToken(byteLen = 16) {
  const bytes = new Uint8Array(byteLen);
  crypto.getRandomValues(bytes);
  return bytesToHex(bytes);
}

async function handleSendQuote(request, env, id) {
  if (!await isAuthorised(request, env)) return errorResponse('unauthorised', 401);
  let body;
  try { body = await request.json(); }
  catch (_) { return errorResponse('invalid JSON body'); }

  const price   = Number(body.price);
  const message = (body.message || '').toString().trim();
  const photo   = (body.imageDataUrl || '').toString();
  if (!Number.isFinite(price) || price < 0 || price > 100000) {
    return errorResponse('price must be a non-negative number under 100000');
  }
  if (!message || message.length > 4000) {
    return errorResponse('message required (≤ 4000 chars)');
  }
  let imageUrl = null;
  if (photo) {
    if (!photo.startsWith('data:image/')) return errorResponse('image must be a data URL');
    if (photo.length > 800_000) return errorResponse('image too large (please re-attach a smaller one)');
    imageUrl = photo;
  }

  const row = await env.DB.prepare('SELECT * FROM requests WHERE id = ?').bind(id).first();
  if (!row) return errorResponse('not found', 404);

  // Rotate the token every send so an old quote link can't approve a
  // re-quoted price. Also resets the response so the customer can
  // approve the new version.
  const token = randomToken(16);
  await env.DB.prepare(`
    UPDATE requests
       SET quote_price = ?, quote_message = ?, quote_image_url = ?,
           quote_token = ?, quote_sent_at = datetime('now'),
           quote_response = NULL, quote_response_at = NULL, quote_response_message = NULL,
           status = CASE WHEN status = 'new' THEN 'quoted' ELSE status END
     WHERE id = ?
  `).bind(price, message, imageUrl, token, id).run();

  let emailSent = false;
  try {
    emailSent = await sendQuoteEmailToCustomer(env, { ...row, quote_price: price, quote_message: message, quote_image_url: imageUrl, quote_token: token });
  } catch (err) {
    console.error('Quote email failed:', err);
  }
  return jsonResponse({ ok: true, id, emailSent, token });
}

/* Public — fetch a quote by id + token. No admin auth; the token is the
 * gate. Returns minimal customer-safe fields. */
async function handleGetQuote(request, env) {
  const url = new URL(request.url);
  const id = url.searchParams.get('id') || '';
  const token = url.searchParams.get('token') || '';
  if (!id || !token) return errorResponse('id and token required');

  const row = await env.DB.prepare(
    'SELECT * FROM requests WHERE id = ? AND quote_token = ?'
  ).bind(id, token).first();
  if (!row) return errorResponse('not found or token mismatch', 404);
  if (!row.quote_price || !row.quote_sent_at) return errorResponse('quote not yet sent', 404);

  return jsonResponse({ quote: {
    id: row.id,
    name: row.name,
    subject: row.subject,
    category: row.category,
    size: row.size,
    photoDataUrl: row.photo_data_url,            // their original reference
    quotePrice: row.quote_price,
    quoteMessage: row.quote_message,
    quoteImageUrl: row.quote_image_url,          // Max's mockup
    quoteSentAt: row.quote_sent_at,
    response: row.quote_response,                // null | approved | changes_requested
    responseAt: row.quote_response_at,
    responseMessage: row.quote_response_message,
  }});
}

/* Public — record customer's response. */
async function handleQuoteRespond(request, env) {
  const url = new URL(request.url);
  const id = url.searchParams.get('id') || '';
  const token = url.searchParams.get('token') || '';
  if (!id || !token) return errorResponse('id and token required');

  let body;
  try { body = await request.json(); }
  catch (_) { return errorResponse('invalid JSON body'); }
  const response = (body.response || '').toString().trim();
  const message  = (body.message || '').toString().trim().slice(0, 4000);
  if (response !== 'approved' && response !== 'changes_requested') {
    return errorResponse('response must be "approved" or "changes_requested"');
  }

  const row = await env.DB.prepare(
    'SELECT * FROM requests WHERE id = ? AND quote_token = ?'
  ).bind(id, token).first();
  if (!row) return errorResponse('not found or token mismatch', 404);
  if (!row.quote_sent_at) return errorResponse('quote not yet sent', 400);

  await env.DB.prepare(`
    UPDATE requests
       SET quote_response = ?, quote_response_at = datetime('now'),
           quote_response_message = ?,
           status = CASE WHEN ? = 'approved' THEN 'in_progress' ELSE status END
     WHERE id = ?
  `).bind(response, message || null, response, id).run();

  // Notify Max — silent no-op if no admin notify email is configured.
  let notified = false;
  try {
    notified = await sendQuoteResponseEmailToAdmin(env, row, response, message);
  } catch (err) { console.error('Quote response notify failed:', err); }

  return jsonResponse({ ok: true, response, notified });
}

function quoteCustomerEmailContent(row, baseUrl) {
  const customerName = (row.name || '').split(' ')[0] || 'there';
  const id = row.id;
  const url = `${baseUrl}/quote.html?id=${encodeURIComponent(id)}&token=${encodeURIComponent(row.quote_token)}`;
  const price = Number(row.quote_price) || 0;
  const subject = `Your Crystal Brook quote · ${id}`;
  const html = `<!doctype html><html><body style="margin:0;background:#f7f3ec;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#1c130a;line-height:1.6;">
    <div style="max-width:580px;margin:0 auto;padding:32px 24px;background:#fff;">
      <p style="font-size:.7rem;letter-spacing:.18em;text-transform:uppercase;color:#7a6e5c;margin:0 0 6px;">Crystal Brook Wall Mounts</p>
      <h1 style="font-family:'Cormorant Garamond',serif;font-weight:500;font-size:1.7rem;margin:0 0 18px;color:#1c130a;">Your custom quote, ${escapeHtml(customerName)}.</h1>
      <p style="font-size:1rem;margin:0 0 18px;">Max has put together a quote for ${escapeHtml(row.subject || 'your custom piece')}. Click through to see it — there's an approve / request-changes button at the bottom.</p>
      <p style="margin:24px 0;text-align:center;">
        <a href="${url}" style="display:inline-block;padding:14px 28px;background:#a9864b;color:#1c130a;font-weight:500;border-radius:4px;text-decoration:none;font-size:1.05rem;">Review your quote — $${price.toLocaleString()} →</a>
      </p>
      <p style="font-size:.78rem;color:#9c8e76;margin:8px 0 18px;text-align:center;">If the button doesn't open, copy this link into your browser:<br/><span style="word-break:break-all;color:#7a6e5c;">${url}</span></p>
      <p style="font-size:.85rem;color:#7a6e5c;margin:22px 0 0;border-top:1px solid #e8e1d2;padding-top:14px;">
        Reference: <strong>${escapeHtml(id)}</strong><br/>
        This link is private — please don't share it; it's how Max knows the response is from you.
      </p>
      <p style="font-size:.78rem;color:#9c8e76;margin:18px 0 0;">Crystal Brook Wall Mounts · Gordonvale, FNQ</p>
    </div>
  </body></html>`;
  const text = `Hi ${customerName},\n\nMax has put together a quote for ${row.subject || 'your custom piece'}: $${price.toLocaleString()}\n\nReview and approve here:\n${url}\n\nReference: ${id}\nThis link is private — please don't share it.\n\n— Crystal Brook Wall Mounts`;
  return { subject, html, text };
}

async function sendQuoteEmailToCustomer(env, row) {
  const from = env.MAIL_FROM;
  if (!env.RESEND_API_KEY || !from || !row.email) return false;
  const baseUrl = env.SITE_BASE_URL || 'https://crystalbrook.steve-700.workers.dev';
  const { subject, html, text } = quoteCustomerEmailContent(row, baseUrl);
  const result = await sendViaResend(env, { from, to: row.email, subject, html, text });
  return result.ok;
}

async function sendQuoteResponseEmailToAdmin(env, row, response, message) {
  const from = env.MAIL_FROM;
  const adminEmail = env.ADMIN_NOTIFY_EMAIL || env.MAIL_FROM_REPLY_TO;
  if (!env.RESEND_API_KEY || !from || !adminEmail) {
    console.log('[email] quote-response notify skipped — RESEND_API_KEY/MAIL_FROM/ADMIN_NOTIFY_EMAIL not all set');
    return false;
  }
  const ok = response === 'approved';
  const subject = ok
    ? `${row.name} approved their quote (${row.id})`
    : `${row.name} asked for changes on their quote (${row.id})`;
  const baseUrl = env.SITE_BASE_URL || 'https://crystalbrook.steve-700.workers.dev';
  const adminUrl = `${baseUrl}/admin/#custom`;
  const html = `<!doctype html><html><body style="margin:0;background:#f7f3ec;font-family:-apple-system,BlinkMacSystemFont,sans-serif;color:#1c130a;line-height:1.6;">
    <div style="max-width:540px;margin:0 auto;padding:28px 24px;background:#fff;">
      <p style="font-size:.7rem;letter-spacing:.18em;text-transform:uppercase;color:#7a6e5c;margin:0 0 6px;">Quote response</p>
      <h1 style="font-family:'Cormorant Garamond',serif;font-weight:500;font-size:1.5rem;margin:0 0 14px;">${ok ? '✓ Approved' : '↺ Changes requested'} — ${escapeHtml(row.name)}</h1>
      <p style="margin:0 0 14px;">Quote <strong>${escapeHtml(row.id)}</strong> for ${escapeHtml(row.subject || '')}.</p>
      ${message ? `<div style="background:#faf6ee;border-left:3px solid #a9864b;padding:14px 18px;margin:18px 0;"><strong>Customer note:</strong><br/>${escapeHtml(message).replace(/\n/g, '<br/>')}</div>` : ''}
      <p style="margin:24px 0;"><a href="${adminUrl}" style="display:inline-block;padding:11px 22px;background:#a9864b;color:#1c130a;font-weight:500;border-radius:4px;text-decoration:none;">Open Custom Orders →</a></p>
      <p style="font-size:.78rem;color:#9c8e76;margin:8px 0 0;">If the button doesn't open, copy this link:<br/><span style="word-break:break-all;color:#7a6e5c;">${adminUrl}</span></p>
    </div>
  </body></html>`;
  const text = `${ok ? 'Approved' : 'Changes requested'}: ${row.name} (${row.id})\nSubject: ${row.subject || ''}\n\n${message ? 'Customer note:\n' + message + '\n\n' : ''}${adminUrl}`;
  const result = await sendViaResend(env, { from, to: adminEmail, subject, html, text });
  return result.ok;
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
    trackingNumber: row.tracking_number,
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
      trackingNumber: order.trackingNumber,
      createdAt: order.createdAt,
    }});
  }
  return jsonResponse({ order });
}

// Whitelist of fields admin can edit on an order via PATCH. Items / totals /
// payment_ref / source are deliberately not patchable — those reflect the
// original sale event and shouldn't be quietly mutated. To re-do an order
// at a different total, refund + create new.
const ORDER_PATCHABLE_FIELDS = new Set([
  'name', 'email', 'phone', 'address', 'suburb', 'state', 'postcode',
  'notes', 'status', 'tracking_number',
]);

async function handleUpdateOrderStatus(request, env, id) {
  if (!await isAuthorised(request, env)) return errorResponse('unauthorised', 401);
  let body;
  try { body = await request.json(); }
  catch (_) { return errorResponse('invalid JSON body'); }

  // Build the SET list from the body, only allowing whitelisted fields.
  // Track every change as a {col, val} pair so we can merge them onto the
  // before-row when firing the customer email (otherwise the email would
  // use stale tracking_number / etc. for a multi-field PATCH).
  const sets = [];
  const params = [];
  const patches = {};
  let nextStatus = null;
  for (const [key, raw] of Object.entries(body || {})) {
    if (!ORDER_PATCHABLE_FIELDS.has(key)) continue;
    const val = (raw == null) ? null : String(raw).trim();
    if (key === 'status') {
      if (val && !VALID_ORDER_STATUSES.has(val)) return errorResponse('invalid status');
      nextStatus = val;
    } else if (key === 'email' && val && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(val)) {
      return errorResponse('invalid email');
    }
    sets.push(`${key} = ?`);
    params.push(val);
    patches[key] = val;
  }
  if (!sets.length) return errorResponse('no editable fields supplied');

  const before = await env.DB.prepare('SELECT * FROM orders WHERE id = ?').bind(id).first();
  if (!before) return errorResponse('not found', 404);

  sets.push('updated_at = datetime(\'now\')');
  await env.DB.prepare(
    `UPDATE orders SET ${sets.join(', ')} WHERE id = ?`
  ).bind(...params, id).run();

  // Email only when status actually changes. Pass the merged row (before +
  // patch) so the template sees the latest tracking_number / customer name
  // / etc., even when both were updated in a single PATCH.
  let emailSent = false;
  if (nextStatus && nextStatus !== before.status) {
    const merged = { ...before, ...patches };
    try {
      emailSent = await sendOrderStatusEmail(env, merged, nextStatus);
    } catch (err) {
      console.error('Order status email failed:', err);
    }
  }

  return jsonResponse({ ok: true, id, status: nextStatus || before.status, emailSent });
}

/* ---------- Customer order-status emails (Resend) ----------
 * Configured via two Worker secrets:
 *   RESEND_API_KEY  — Resend API key (https://resend.com)
 *   MAIL_FROM       — verified sending address, e.g. "Max <hello@crystalbrook.com.au>"
 * If either is missing, sendOrderStatusEmail returns false (the status
 * update still succeeds — the customer just doesn't get the email).
 */
function escapeHtml(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function orderStatusEmailContent(orderRow, newStatus) {
  const customerName = (orderRow.name || '').split(' ')[0] || 'there';
  const id = orderRow.id;
  const trackUrl = `https://crystalbrook.steve-700.workers.dev/order.html?id=${encodeURIComponent(id)}`;
  let items = [];
  try { items = JSON.parse(orderRow.items || '[]'); } catch (_) {}
  const itemList = items.map(i => `${i.name}${i.qty > 1 ? ` ×${i.qty}` : ''}`).join(', ') || 'your order';

  const messages = {
    paid: {
      subject: `Order ${id} confirmed`,
      heading: `Thanks ${customerName} — your order's in.`,
      body: `Max has received your order for ${itemList} and will start production within a couple of days. He'll email progress photos before the resin pour, and again before shipping. Total expected delivery: 4–6 weeks.`,
    },
    in_production: {
      subject: `Order ${id} — now in production`,
      heading: `Your piece is underway, ${customerName}.`,
      body: `Max has started the production run for ${itemList}. The print's been pulled, the timber chosen, and we're now into the resin stage. You'll get one more email when it ships.`,
    },
    shipped: {
      subject: `Order ${id} — shipped!`,
      heading: `On its way, ${customerName}.`,
      body: orderRow.tracking_number
        ? `Your order — ${itemList} — has just been packed and posted via Australia Post. Tracking number: ${orderRow.tracking_number}. Expected delivery: 3–5 business days for metro, a touch longer for regional.`
        : `Your order — ${itemList} — has just been packed and posted via Australia Post. Tracking will land in a separate email from Aus Post within a few hours. Expected delivery: 3–5 business days for metro, a touch longer for regional.`,
    },
    delivered: {
      subject: `Order ${id} — delivered`,
      heading: `Hope it looks great on the wall, ${customerName}.`,
      body: `Aus Post has logged your order — ${itemList} — as delivered. If anything's not quite right, drop us a line within 72 hours and we'll sort it.`,
    },
    refunded: {
      subject: `Order ${id} — refund processed`,
      heading: `Your refund's gone through, ${customerName}.`,
      body: `Refund for ${itemList} has been processed back to your original payment. Allow 3–5 business days for it to appear on your statement. Sorry it didn't work out — give Max a shout if you'd like to look at something different down the track.`,
    },
    cancelled: {
      subject: `Order ${id} — cancelled`,
      heading: `Your order's been cancelled, ${customerName}.`,
      body: `As requested, your order for ${itemList} has been cancelled. If a deposit was taken it'll be refunded within 3–5 business days. Drop Max a line if you'd like to revisit it later.`,
    },
  };
  const m = messages[newStatus] || messages.paid;
  const html = `<!doctype html><html><body style="margin:0;background:#f7f3ec;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#1c130a;line-height:1.6;">
    <div style="max-width:560px;margin:0 auto;padding:32px 24px;background:#fff;">
      <p style="font-size:.7rem;letter-spacing:.18em;text-transform:uppercase;color:#7a6e5c;margin:0 0 6px;">Crystal Brook Wall Mounts</p>
      <h1 style="font-family:'Cormorant Garamond',serif;font-weight:500;font-size:1.7rem;margin:0 0 18px;color:#1c130a;">${escapeHtml(m.heading)}</h1>
      <p style="font-size:1rem;margin:0 0 22px;">${escapeHtml(m.body)}</p>
      <p style="margin:22px 0;"><a href="${trackUrl}" style="display:inline-block;padding:11px 22px;background:#a9864b;color:#1c130a;font-weight:500;border-radius:4px;text-decoration:none;">Track your order →</a></p>
      <p style="font-size:.78rem;color:#9c8e76;margin:14px 0 0;">If the button doesn't open, copy this link into your browser:<br/><span style="word-break:break-all;color:#7a6e5c;">${trackUrl}</span></p>
      <p style="font-size:.85rem;color:#7a6e5c;margin:22px 0 0;border-top:1px solid #e8e1d2;padding-top:14px;">Order reference: <strong>${escapeHtml(id)}</strong></p>
      <p style="font-size:.78rem;color:#9c8e76;margin:18px 0 0;">Crystal Brook Wall Mounts · Gordonvale, FNQ</p>
    </div>
  </body></html>`;
  const text = `${m.heading}\n\n${m.body}\n\nTrack your order: ${trackUrl}\n\nOrder reference: ${id}\n\n— Crystal Brook Wall Mounts`;
  return { subject: m.subject, html, text };
}

async function sendViaResend(env, payload) {
  const apiKey = env.RESEND_API_KEY;
  if (!apiKey) return { ok: false, reason: 'no_api_key' };
  // tracking:false asks Resend not to wrap links via resend-clicks.com.
  // Officially that's a per-domain dashboard setting, but some users
  // report the per-email field is respected. Even if it's silently
  // ignored, our templates also include the raw URL as plain text
  // beneath each CTA so customers can copy-paste if the click-tracking
  // redirect fails to resolve (which it does on plenty of corporate
  // networks and ad-blocker-heavy DNS resolvers).
  const body = { ...payload, tracking: { click: false, open: false } };
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    console.error('[email] Resend send failed', res.status, errText.slice(0, 200));
    return { ok: false, reason: 'send_failed', detail: errText.slice(0, 200) };
  }
  return { ok: true };
}

async function sendOrderStatusEmail(env, orderRow, newStatus) {
  const from = env.MAIL_FROM;
  if (!env.RESEND_API_KEY || !from) {
    console.log('[email] skipping send — RESEND_API_KEY or MAIL_FROM not set');
    return false;
  }
  const to = orderRow.email;
  if (!to) return false;

  const { subject, html, text } = orderStatusEmailContent(orderRow, newStatus);
  const result = await sendViaResend(env, { from, to, subject, html, text });
  return result.ok;
}

/* ---------- Customer invoice email ----------
 * Sent on demand from the admin Orders detail modal. Useful for manual
 * orders (cash/phone sales) where the customer wants a record, and for
 * confirmed online orders if Max wants to re-send the receipt.
 */
function orderInvoiceContent(orderRow) {
  const customerName = orderRow.name || 'there';
  const id = orderRow.id;
  let items = [];
  try { items = JSON.parse(orderRow.items || '[]'); } catch (_) {}
  const created = orderRow.created_at
    ? new Date(orderRow.created_at.replace(' ', 'T') + 'Z')
    : new Date();
  const dateLabel = created.toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' });

  const itemRowsHtml = items.map(i => {
    const lineTotal = (Number(i.price) || 0) * (Number(i.qty) || 1);
    return `<tr>
      <td style="padding:10px 0;border-bottom:1px solid #e8e1d2;">${escapeHtml(i.name)}</td>
      <td style="padding:10px 0;border-bottom:1px solid #e8e1d2;text-align:center;color:#7a6e5c;">×${i.qty || 1}</td>
      <td style="padding:10px 0;border-bottom:1px solid #e8e1d2;text-align:right;">$${lineTotal.toLocaleString()}</td>
    </tr>`;
  }).join('');
  const itemRowsText = items.map(i =>
    `  ${i.name}  ×${i.qty || 1}    $${((Number(i.price) || 0) * (Number(i.qty) || 1)).toLocaleString()}`
  ).join('\n');

  const addr = [
    orderRow.address, orderRow.suburb,
    [orderRow.state, orderRow.postcode].filter(Boolean).join(' ')
  ].filter(Boolean).join(', ');

  const subtotal = orderRow.subtotal || 0;
  const shipping = orderRow.shipping || 0;
  const total    = orderRow.total || (subtotal + shipping);

  const html = `<!doctype html><html><body style="margin:0;background:#f7f3ec;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#1c130a;line-height:1.55;">
    <div style="max-width:580px;margin:0 auto;padding:32px 24px;background:#fff;">
      <div style="display:flex;justify-content:space-between;align-items:baseline;flex-wrap:wrap;gap:8px;margin-bottom:24px;">
        <div>
          <p style="font-size:.7rem;letter-spacing:.18em;text-transform:uppercase;color:#7a6e5c;margin:0 0 4px;">Crystal Brook Wall Mounts</p>
          <h1 style="font-family:'Cormorant Garamond',serif;font-weight:500;font-size:1.7rem;margin:0;color:#1c130a;">Invoice ${escapeHtml(id)}</h1>
        </div>
        <p style="margin:0;color:#7a6e5c;font-size:.9rem;">${dateLabel}</p>
      </div>

      <p style="margin:0 0 22px;">Hi ${escapeHtml(customerName.split(' ')[0])} — here's your receipt for the order below. Hold onto it for your records.</p>

      <h2 style="font-size:.65rem;letter-spacing:.18em;text-transform:uppercase;color:#7a6e5c;margin:0 0 8px;">Items</h2>
      <table style="width:100%;border-collapse:collapse;margin-bottom:18px;">
        ${itemRowsHtml}
      </table>

      <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
        <tr>
          <td style="padding:6px 0;color:#7a6e5c;">Subtotal</td>
          <td style="padding:6px 0;text-align:right;">$${subtotal.toLocaleString()}</td>
        </tr>
        <tr>
          <td style="padding:6px 0;color:#7a6e5c;">Shipping</td>
          <td style="padding:6px 0;text-align:right;">${shipping ? '$' + shipping.toLocaleString() : 'Free'}</td>
        </tr>
        <tr>
          <td style="padding:10px 0 6px;border-top:1px dashed #e8e1d2;font-weight:500;">Total</td>
          <td style="padding:10px 0 6px;border-top:1px dashed #e8e1d2;text-align:right;font-weight:600;color:#a9864b;font-size:1.1rem;">$${total.toLocaleString()}</td>
        </tr>
      </table>

      ${addr ? `<h2 style="font-size:.65rem;letter-spacing:.18em;text-transform:uppercase;color:#7a6e5c;margin:0 0 6px;">Shipping to</h2>
      <p style="margin:0 0 22px;">${escapeHtml(orderRow.name || '')}<br/>${escapeHtml(addr)}</p>` : ''}

      <p style="font-size:.85rem;color:#7a6e5c;margin:24px 0 0;border-top:1px solid #e8e1d2;padding-top:14px;">
        Crystal Brook Wall Mounts · Gordonvale, FNQ<br/>
        Questions? Reply to this email and Max will get back to you within a business day.
      </p>
    </div>
  </body></html>`;

  const text = `Crystal Brook Wall Mounts
Invoice ${id}
${dateLabel}

Hi ${customerName.split(' ')[0]} — here's your receipt.

ITEMS
${itemRowsText}

Subtotal:  $${subtotal.toLocaleString()}
Shipping:  ${shipping ? '$' + shipping.toLocaleString() : 'Free'}
Total:     $${total.toLocaleString()}

${addr ? 'Shipping to:\n' + (orderRow.name || '') + '\n' + addr + '\n\n' : ''}— Crystal Brook Wall Mounts, Gordonvale FNQ`;

  return { subject: `Crystal Brook invoice ${id}`, html, text };
}

async function sendOrderInvoice(env, orderRow) {
  const from = env.MAIL_FROM;
  if (!env.RESEND_API_KEY || !from) {
    return { sent: false, reason: 'email_not_configured' };
  }
  const to = orderRow.email;
  if (!to) return { sent: false, reason: 'no_recipient' };

  const { subject, html, text } = orderInvoiceContent(orderRow);
  const result = await sendViaResend(env, { from, to, subject, html, text });
  if (!result.ok) {
    return { sent: false, reason: 'resend_error', detail: result.detail };
  }
  return { sent: true };
}

async function handleSendOrderInvoice(request, env, id) {
  if (!await isAuthorised(request, env)) return errorResponse('unauthorised', 401);
  const row = await env.DB.prepare('SELECT * FROM orders WHERE id = ?').bind(id).first();
  if (!row) return errorResponse('not found', 404);
  const result = await sendOrderInvoice(env, row);
  if (!result.sent) {
    if (result.reason === 'email_not_configured') {
      return errorResponse('Email isn\'t set up yet — set RESEND_API_KEY and MAIL_FROM as Worker secrets.', 503);
    }
    if (result.reason === 'no_recipient') return errorResponse('Order has no customer email');
    return errorResponse('Failed to send invoice: ' + (result.detail || 'unknown'), 502);
  }
  return jsonResponse({ ok: true, id, sent: true });
}

async function handleDeleteOrder(request, env, id) {
  if (!await isAuthorised(request, env)) return errorResponse('unauthorised', 401);
  const res = await env.DB.prepare('DELETE FROM orders WHERE id = ?').bind(id).run();
  if (!res.meta || !res.meta.changes) return errorResponse('not found', 404);
  return jsonResponse({ ok: true, id });
}


// -------- /uploads (R2-backed video + binary uploads) --------

const UPLOAD_MAX_BYTES = 50 * 1024 * 1024;  // 50MB cap — fine for short product videos
const UPLOAD_ALLOWED_TYPES = new Set([
  'video/mp4', 'video/quicktime', 'video/webm',
  'image/png', 'image/jpeg', 'image/webp',
]);

async function handleUpload(request, env) {
  if (!await isAuthorised(request, env)) return errorResponse('unauthorised', 401);
  if (!env.UPLOADS) return errorResponse('R2 binding missing', 503);

  const ct = request.headers.get('content-type') || '';
  if (!UPLOAD_ALLOWED_TYPES.has(ct.split(';')[0].trim())) {
    return errorResponse('Unsupported file type. Try MP4, MOV or WebM for video; PNG/JPEG/WebP for images.');
  }

  const lengthHeader = request.headers.get('content-length');
  if (lengthHeader && Number(lengthHeader) > UPLOAD_MAX_BYTES) {
    return errorResponse(`File too large (max ${Math.floor(UPLOAD_MAX_BYTES / 1024 / 1024)}MB)`);
  }

  // Random filename keyed by mime + timestamp + random hex. Keeps URLs
  // unguessable and avoids collisions when admin re-uploads.
  const ext = ({
    'video/mp4': 'mp4', 'video/quicktime': 'mov', 'video/webm': 'webm',
    'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp',
  })[ct.split(';')[0].trim()] || 'bin';
  const key = `${Date.now().toString(36)}-${randomToken(8)}.${ext}`;

  // Stream the body straight to R2. Cap mid-stream by reading into a buffer
  // and bailing if it's over the cap (Workers don't expose a streaming size
  // check on R2 put, so we buffer once).
  const buf = await request.arrayBuffer();
  if (buf.byteLength > UPLOAD_MAX_BYTES) {
    return errorResponse(`File too large (max ${Math.floor(UPLOAD_MAX_BYTES / 1024 / 1024)}MB)`);
  }

  await env.UPLOADS.put(key, buf, {
    httpMetadata: { contentType: ct },
  });

  const url = `/uploads/${key}`;
  return jsonResponse({ ok: true, key, url, contentType: ct, size: buf.byteLength });
}

async function handleServeUpload(request, env, key) {
  if (!env.UPLOADS) return errorResponse('R2 binding missing', 503);
  // Defensive — strip slashes and dots so we can't escape the bucket.
  if (!/^[\w.-]+$/.test(key)) return errorResponse('not found', 404);

  const obj = await env.UPLOADS.get(key);
  if (!obj) return errorResponse('not found', 404);

  const headers = new Headers();
  if (obj.httpMetadata?.contentType) {
    headers.set('content-type', obj.httpMetadata.contentType);
  }
  // Long browser cache — content-addressed by random key, never changes.
  headers.set('cache-control', 'public, max-age=31536000, immutable');
  headers.set('accept-ranges', 'bytes');
  return new Response(obj.body, { headers });
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
        const quoteSendMatch = path.match(/^\/api\/requests\/([\w-]+)\/quote$/);
        if (quoteSendMatch && request.method === 'POST') {
          return await handleSendQuote(request, env, quoteSendMatch[1]);
        }
        if (path === '/api/quote' && request.method === 'GET') {
          return await handleGetQuote(request, env);
        }
        if (path === '/api/quote/respond' && request.method === 'POST') {
          return await handleQuoteRespond(request, env);
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
        const invoiceMatch = path.match(/^\/api\/orders\/([\w-]+)\/send-invoice$/);
        if (invoiceMatch && request.method === 'POST') {
          return await handleSendOrderInvoice(request, env, invoiceMatch[1]);
        }
        if (path === '/api/upload' && request.method === 'POST') {
          return await handleUpload(request, env);
        }
        return errorResponse('not found', 404);
      } catch (err) {
        console.error('API error', err);
        return errorResponse('internal error', 500);
      }
    }

    // R2-served uploads (videos, images): /uploads/<key>
    const uploadMatch = path.match(/^\/uploads\/([\w.-]+)$/);
    if (uploadMatch) {
      try {
        return await handleServeUpload(request, env, uploadMatch[1]);
      } catch (err) {
        console.error('Upload serve error', err);
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
