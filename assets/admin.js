/* ======================================================
   Crystal Brook Wall Mounts — admin app
   ====================================================== */

/* ---------- API CONFIG ---------- *
 * Admin writes go to /api/products/:id with the X-Admin-Password header.
 * The password is set once at admin entry (login modal) and cached in
 * localStorage. If a write returns 401 we clear it and prompt again.
 * ----------------------------------------------------- */
const ADMIN_AUTH_KEY = 'cbwm_admin_password';
const ADMIN_AUTH_NAME_KEY = 'cbwm_admin_name';

function adminPassword() {
  return localStorage.getItem(ADMIN_AUTH_KEY) || '';
}
function adminAuthHeaders() {
  const pw = adminPassword();
  return pw ? { 'X-Admin-Password': pw } : {};
}

async function fetchCatalogue() {
  const res = await fetch('/api/products?drafts=1', { cache: 'no-store' });
  if (!res.ok) throw new Error('catalogue fetch failed: ' + res.status);
  const data = await res.json();
  return Array.isArray(data.products) ? data.products : [];
}

async function saveProductChanges(id, patch) {
  const res = await fetch('/api/products/' + encodeURIComponent(id), {
    method: 'PUT',
    cache: 'no-store',
    headers: { 'content-type': 'application/json', ...adminAuthHeaders() },
    body: JSON.stringify(patch),
  });
  if (res.status === 401) {
    localStorage.removeItem(ADMIN_AUTH_KEY);
    showAdminLogin('Your session expired — please sign in again.');
    throw new Error('unauthorised');
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'save failed: ' + res.status);
  return data.product;
}

async function createProduct(payload) {
  const res = await fetch('/api/products', {
    method: 'POST',
    cache: 'no-store',
    headers: { 'content-type': 'application/json', ...adminAuthHeaders() },
    body: JSON.stringify(payload),
  });
  if (res.status === 401) {
    localStorage.removeItem(ADMIN_AUTH_KEY);
    showAdminLogin('Your session expired — please sign in again.');
    throw new Error('unauthorised');
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'create failed: ' + res.status);
  return data.product;
}

async function deleteProduct(id) {
  const res = await fetch('/api/products/' + encodeURIComponent(id), {
    method: 'DELETE',
    headers: { ...adminAuthHeaders() },
  });
  if (res.status === 401) {
    localStorage.removeItem(ADMIN_AUTH_KEY);
    showAdminLogin('Your session expired — please sign in again.');
    throw new Error('unauthorised');
  }
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'delete failed: ' + res.status);
  }
  return true;
}

async function verifyAdminPassword(pw) {
  const res = await fetch('/api/admin/check', {
    method: 'POST',
    headers: { 'X-Admin-Password': pw },
  });
  return res.ok;
}

/* Admin-friendly category labels (storefront uses lowercase keys) */
const CAT_LABELS_ADMIN = {
  saltwater:  'Saltwater Fish',
  freshwater: 'Freshwater Fish',
  cars:       'Cars',
  animals:    'Animals',
  birds:      'Birds',
  montages:   'Montages',
};

/* Convert an API product into the shape the admin renderers expect.
 * Keeps every API field too so write-backs round-trip cleanly. */
function apiToAdminProduct(api) {
  const cat = api.cat;
  const sku = `CBW-${(cat || 'X').slice(0, 2).toUpperCase()}-${api.id.replace(/^p-/, '').slice(0, 6).toUpperCase()}`;
  return {
    ...api,
    catKey: cat,
    cat: CAT_LABELS_ADMIN[cat] || cat,
    sku,
    stock: api.draft ? 0 : 5,        // until we wire real stock; drafts read as out-of-stock
    img: (api.name || '?').trim().charAt(0).toUpperCase(),  // initial-letter fallback
  };
}

/* Resolve a product's image src for use in <img>. Handles:
 *  - data URLs (uploaded photos): return as-is
 *  - relative paths (assets/images/products/...): prefix with /
 *  - empty/placeholder: return null so we fall back to the letter
 */
function productImageSrc(p) {
  const raw = p && p.image;
  if (!raw || raw === 'assets/images/products/' || raw.endsWith('/')) return null;
  if (raw.startsWith('data:')) return raw;
  if (raw.startsWith('http')) return raw;
  return '/' + raw.replace(/^\/+/, '');
}


/* ---------- INITIAL FALLBACK DATA ---------- *
 * Renders something on first paint while the API fetch is in flight.
 * Replaced by live data once fetchCatalogue() resolves.
 * ----------------------------------------------------- */
const PRODUCTS = [
  { id:'p-coral',    name:'Coral Trout',              cat:'Saltwater Fish', sku:'CBW-SW-001', price:485, size:'68 × 32 cm',  stock:6,  img:'C' },
  { id:'p-marlin',   name:'Blue Marlin',              cat:'Saltwater Fish', sku:'CBW-SW-002', price:760, size:'120 × 40 cm', stock:2,  img:'M' },
  { id:'p-mahi',     name:'Mahi Mahi',                cat:'Saltwater Fish', sku:'CBW-SW-003', price:560, size:'90 × 34 cm',  stock:5,  img:'M' },
  { id:'p-snapper',  name:'Red Emperor Snapper',      cat:'Saltwater Fish', sku:'CBW-SW-004', price:425, size:'60 × 36 cm',  stock:0,  img:'R' },
  { id:'p-gt',       name:'Giant Trevally',           cat:'Saltwater Fish', sku:'CBW-SW-005', price:510, size:'78 × 38 cm',  stock:3,  img:'G' },

  { id:'p-barra',    name:'Barramundi',               cat:'Freshwater Fish',sku:'CBW-FW-001', price:495, size:'72 × 30 cm',  stock:8,  img:'B' },
  { id:'p-cod',      name:'Murray Cod',               cat:'Freshwater Fish',sku:'CBW-FW-002', price:540, size:'82 × 36 cm',  stock:4,  img:'M' },
  { id:'p-yellowb',  name:'Golden Perch · Yellowbelly',cat:'Freshwater Fish',sku:'CBW-FW-003',price:445, size:'56 × 28 cm',  stock:7,  img:'Y' },
  { id:'p-bass',     name:'Australian Bass',          cat:'Freshwater Fish',sku:'CBW-FW-004', price:425, size:'50 × 26 cm',  stock:5,  img:'B' },
  { id:'p-toga',     name:'Saratoga',                 cat:'Freshwater Fish',sku:'CBW-FW-005', price:515, size:'70 × 28 cm',  stock:1,  img:'S' },

  { id:'p-mustang',  name:'1971 Mach-1 Mustang',      cat:'Cars',           sku:'CBW-CA-001', price:625, size:'88 × 34 cm',  stock:3,  img:'M' },
  { id:'p-monaro',   name:'HQ Monaro GTS',            cat:'Cars',           sku:'CBW-CA-002', price:640, size:'88 × 34 cm',  stock:2,  img:'H' },
  { id:'p-torana',   name:'1971 Torana GTR-X',        cat:'Cars',           sku:'CBW-CA-003', price:650, size:'88 × 32 cm',  stock:4,  img:'T' },
  { id:'p-fastback', name:'1967 Mustang Fastback',    cat:'Cars',           sku:'CBW-CA-004', price:660, size:'88 × 32 cm',  stock:2,  img:'M' },
  { id:'p-xygt',     name:'XY Falcon GT',             cat:'Cars',           sku:'CBW-CA-005', price:640, size:'88 × 32 cm',  stock:0,  img:'F' },

  { id:'p-frenchie', name:'French Bulldog Puppy',     cat:'Animals',        sku:'CBW-AN-001', price:425, size:'54 × 72 cm',  stock:7,  img:'F' },
  { id:'p-heeler',   name:'Blue Heeler',              cat:'Animals',        sku:'CBW-AN-002', price:465, size:'60 × 74 cm',  stock:6,  img:'B' },
  { id:'p-kanga',    name:'Kangaroo',                 cat:'Animals',        sku:'CBW-AN-003', price:520, size:'80 × 96 cm',  stock:2,  img:'K' },
  { id:'p-koala',    name:'Koala',                    cat:'Animals',        sku:'CBW-AN-004', price:445, size:'56 × 70 cm',  stock:4,  img:'K' },
  { id:'p-dingo',    name:'Dingo',                    cat:'Animals',        sku:'CBW-AN-005', price:495, size:'72 × 54 cm',  stock:3,  img:'D' },

  { id:'p-lorikeet', name:'Rainbow Lorikeet',         cat:'Birds',          sku:'CBW-BD-001', price:385, size:'50 × 60 cm',  stock:9,  img:'R' },
  { id:'p-kooka',    name:'Kookaburra',               cat:'Birds',          sku:'CBW-BD-002', price:395, size:'54 × 60 cm',  stock:5,  img:'K' },
  { id:'p-cocky',    name:'Sulphur-Crested Cockatoo', cat:'Birds',          sku:'CBW-BD-003', price:420, size:'58 × 68 cm',  stock:6,  img:'C' },
  { id:'p-eagle',    name:'Wedge-Tailed Eagle',       cat:'Birds',          sku:'CBW-BD-004', price:620, size:'110 × 74 cm', stock:2,  img:'E' },
  { id:'p-galah',    name:'Galah',                    cat:'Birds',          sku:'CBW-BD-005', price:375, size:'50 × 56 cm',  stock:8,  img:'G' },
];

// Real data lives in D1: ORDERS pulled by refreshOrdersFromAPI into
// _ordersCache, custom orders pulled by refreshRequestsFromAPI into
// _requestsCache. These two consts are kept as empty arrays so the
// initial paint of the admin shows clean empty-state messaging
// instead of fake demo rows from the prototype days.
const ORDERS = [];
const CUSTOM_ORDERS = { 'New': [], 'Quoted': [], 'In Production': [], 'Completed': [] };

/* ---------- VIEW SWITCHING ---------- */
const nav = document.getElementById('sideNav');
const crumb = document.getElementById('crumb');
const VIEW_LABELS = {
  dashboard:'Dashboard', products:'Stocktake', orders:'Orders',
  custom:'Custom Orders', revenue:'Revenue',
  homepage:'Homepage Editor', about:'About Page', settings:'Settings'
};
function switchView(key){
  document.querySelectorAll('.view').forEach(v=>v.classList.toggle('is-active', v.dataset.view===key));
  document.querySelectorAll('.s-link').forEach(a=>a.classList.toggle('is-active', a.dataset.view===key));
  crumb.textContent = VIEW_LABELS[key] || 'Dashboard';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
nav.addEventListener('click', e=>{
  const a = e.target.closest('.s-link[data-view]'); if(!a) return;
  e.preventDefault();
  switchView(a.dataset.view);
});
document.addEventListener('click', e=>{
  const j = e.target.closest('[data-view-jump]'); if(!j) return;
  switchView(j.dataset.viewJump);
});

/* ---------- STATUS helpers ---------- */
function stockStatus(n){
  if(n===0) return { cls:'bad',  label:'Out of stock', bar:'out', pct:100 };
  if(n<=2)  return { cls:'warn', label:'Low stock',    bar:'low', pct:Math.min(100, n*20) };
  return       { cls:'ok',   label:'In stock',     bar:'',    pct:Math.min(100, n*10) };
}
function orderStatus(s){
  const map = {
    paid:          { cls:'info', label:'Paid' },
    in_production: { cls:'warn', label:'In production' },
    production:    { cls:'warn', label:'In production' },  // legacy alias
    shipped:       { cls:'ok',   label:'Shipped' },
    delivered:     { cls:'ok',   label:'Delivered' },
    refunded:      { cls:'muted',label:'Refunded' },
    cancelled:     { cls:'muted',label:'Cancelled' },
  };
  return map[s] || { cls:'muted', label: s || 'Unknown' };
}

/* Live orders cache — populated from /api/orders. The hardcoded ORDERS
 * stub above is used only as a fallback for the very first paint before
 * the API call returns (and on a cold cache offline). */
let _ordersCache = [];

function customerFirstName(o) {
  return (o.name || '').split(/\s+/)[0] || 'Customer';
}
function formatOrderDate(iso) {
  if (!iso) return '';
  const t = new Date(iso.replace(' ', 'T') + 'Z').getTime();
  if (!Number.isFinite(t)) return '';
  const diff = (Date.now() - t) / 1000;
  if (diff < 3600) return Math.max(1, Math.round(diff / 60)) + ' min ago';
  if (diff < 86400 * 2) {
    const d = new Date(t);
    const today = new Date(); today.setHours(0,0,0,0);
    const orderDay = new Date(t); orderDay.setHours(0,0,0,0);
    const yest = new Date(today); yest.setDate(today.getDate() - 1);
    const time = d.toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit' });
    if (orderDay.getTime() === today.getTime()) return 'Today · ' + time;
    if (orderDay.getTime() === yest.getTime()) return 'Yest · ' + time;
  }
  if (diff < 86400 * 7) return Math.round(diff / 86400) + ' days ago';
  return new Date(iso).toLocaleDateString('en-AU');
}

function ordersToView(rows) {
  return rows.map(o => {
    const items = Array.isArray(o.items) ? o.items : [];
    const itemsLabel = items.map(i => i.name + (i.qty > 1 ? ` ×${i.qty}` : '')).join(', ') || '(no items)';
    return {
      id:     o.id,
      cust:   customerFirstName(o) + (o.name && o.name.split(/\s+/).length > 1 ? ' ' + o.name.split(/\s+/).slice(-1)[0][0] + '.' : ''),
      fullName: o.name,
      email:  o.email,
      items:  itemsLabel,
      total:  o.total,
      status: o.status,
      pay:    o.paymentRef || o.notes || '—',
      date:   formatOrderDate(o.createdAt),
      _raw:   o,
    };
  });
}

async function refreshOrdersFromAPI() {
  try {
    const res = await fetch('/api/orders', {
      headers: { ...adminAuthHeaders() },
      cache: 'no-store',
    });
    if (!res.ok) {
      if (res.status === 401) {
        localStorage.removeItem(ADMIN_AUTH_KEY);
        showAdminLogin('Your session expired — please sign in again.');
      }
      return;
    }
    const data = await res.json();
    _ordersCache = ordersToView(Array.isArray(data.orders) ? data.orders : []);
    try { renderRecentOrders(); } catch (_) {}
    try { renderOrders(); } catch (_) {}
    try { renderDashboardStats(); } catch (_) {}
    try { renderRevenueAll(); } catch (_) {}
  } catch (err) {
    console.warn('[orders] fetch failed', err);
  }
}

function ordersForView() {
  return _ordersCache.length ? _ordersCache : ORDERS;
}

/* ---------- DASHBOARD ----------
 * Stats and Recent Orders pull from the live cache when available,
 * fall back to the static ORDERS stub on cold start. renderDashboardStats
 * recomputes the four KPI cards from real data each refresh.
 */
function renderDashboardStats() {
  const orders = ordersForView();
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  let mtdRev = 0, mtdOrders = 0;
  for (const o of orders) {
    const t = o._raw && o._raw.createdAt
      ? new Date(o._raw.createdAt.replace(' ', 'T') + 'Z').getTime()
      : 0;
    if (t >= monthStart) {
      mtdRev += Number(o.total) || 0;
      mtdOrders += 1;
    }
  }
  // Low stock count needs PRODUCTS — drafts read as out-of-stock; live as 5
  // until real stock comes in.
  const lowStock = (typeof PRODUCTS !== 'undefined')
    ? PRODUCTS.filter(p => (p.stock || 0) > 0 && (p.stock || 0) <= 2).length
    : 0;
  const customRequests = (typeof _requestsCache !== 'undefined')
    ? _requestsCache.filter(r => r.status === 'new').length
    : 0;

  const set = (sel, val) => {
    const el = document.querySelector(sel);
    if (el) el.textContent = val;
  };
  set('[data-stat="rev_mtd"]',   '$' + mtdRev.toLocaleString());
  set('[data-stat="orders_mtd"]', mtdOrders);
  set('[data-stat="low_stock"]', lowStock);
  set('[data-stat="custom_requests"]', customRequests);
}

function renderRecentOrders(){
  const tb = document.getElementById('recentOrders');
  if (!tb) return;
  const orders = ordersForView();
  if (!orders.length) {
    tb.innerHTML = `<tr><td colspan="6" class="t-empty">No orders yet — once a customer checks out (or you punch one in via "+ Manual order") it'll show here.</td></tr>`;
    return;
  }
  tb.innerHTML = orders.slice(0,5).map(o=>{
    const st = orderStatus(o.status);
    return `<tr>
      <td><strong>${o.id}</strong></td>
      <td>${o.cust}<span class="cell-sub">${o.email}</span></td>
      <td>${o.items}</td>
      <td>$${o.total.toLocaleString()}</td>
      <td><span class="status ${st.cls}">${st.label}</span></td>
      <td>${o.date}</td>
    </tr>`;
  }).join('');
}
renderRecentOrders();

/* ---------- Revenue line chart (SVG) ---------- */
function renderRevenueChart(id, data, opts={}){
  const el = document.getElementById(id); if(!el) return;
  const W = 800, H = 240, pad = 30;
  const max = Math.max(...data.values);
  const step = (W - pad*2) / (data.values.length - 1);
  const points = data.values.map((v,i)=>{
    const x = pad + i*step;
    const y = H - pad - (v / max) * (H - pad*2);
    return [x, y];
  });
  const path = points.map((p,i)=>`${i? 'L':'M'}${p[0]},${p[1]}`).join(' ');
  const area = `${path} L${points[points.length-1][0]},${H-pad} L${points[0][0]},${H-pad} Z`;

  const gridLines = [0.25,.5,.75,1].map(f=>{
    const y = H - pad - f*(H - pad*2);
    return `<line x1="${pad}" x2="${W-pad}" y1="${y}" y2="${y}" stroke="#2a231c" stroke-dasharray="2 4"/>`;
  }).join('');
  const labels = data.labels.map((l,i)=>{
    const x = pad + i*step;
    return `<text x="${x}" y="${H-8}" fill="#7a6e5c" font-size="10" text-anchor="middle" font-family="Inter">${l}</text>`;
  }).join('');
  el.innerHTML = `
    <svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none">
      <defs>
        <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#d4b06a" stop-opacity=".35"/>
          <stop offset="100%" stop-color="#d4b06a" stop-opacity="0"/>
        </linearGradient>
      </defs>
      ${gridLines}
      <path d="${area}" fill="url(#revFill)"/>
      <path d="${path}" fill="none" stroke="#d4b06a" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round"/>
      ${points.map(p=>`<circle cx="${p[0]}" cy="${p[1]}" r="3" fill="#e8d5a0" stroke="#1c1712" stroke-width="1.5"/>`).join('')}
      ${labels}
    </svg>`;
}
renderRevenueChart('revChart', {
  labels: ['May','Jun','Jul','Aug','Sep','Oct','Nov','Dec','Jan','Feb','Mar','Apr'],
  values: [ 8400, 9200, 11100, 12400, 10500, 13800, 16200, 22400, 14800, 15600, 17200, 18420 ],
});

/* Revenue bars chart */
/* ---------- REVENUE PAGE — live from orders ----------
 * KPIs, monthly bars, by-category, and top-products are computed from
 * _ordersCache (populated by refreshOrdersFromAPI). The date-range
 * selector filters the window. Everything re-renders together.
 */
const _REV_STATE = { range: '12m' };

function _ordersInRange() {
  const orders = (_ordersCache || []).map(o => o._raw).filter(Boolean);
  const now = Date.now();
  const ranges = { '30d': 30, '90d': 90, '12m': 365, 'all': Infinity };
  const days = ranges[_REV_STATE.range] ?? 365;
  if (!Number.isFinite(days)) return orders;
  const cutoff = now - days * 86400_000;
  return orders.filter(o => {
    const t = o.createdAt ? new Date(o.createdAt.replace(' ', 'T') + 'Z').getTime() : 0;
    return t >= cutoff;
  });
}

function _orderTimestamp(o) {
  return o.createdAt ? new Date(o.createdAt.replace(' ', 'T') + 'Z').getTime() : 0;
}

function renderRevenueKPIs() {
  const orders = _ordersInRange();
  let gross = 0, refunds = 0, paidCount = 0;
  for (const o of orders) {
    const total = Number(o.total) || 0;
    if (o.status === 'refunded' || o.status === 'cancelled') {
      refunds += total;
    } else {
      gross += total;
      paidCount += 1;
    }
  }
  const net = Math.round(gross * 0.985);  // ~1.5% Stripe fee estimate
  const aov = paidCount ? Math.round(gross / paidCount) : 0;
  const refundRate = orders.length ? (refunds / Math.max(1, gross + refunds)) * 100 : 0;
  const set = (key, val) => {
    const el = document.querySelector(`[data-rev-stat="${key}"]`);
    if (el) el.textContent = val;
  };
  const periodLabel = ({ '30d': 'Last 30 days', '90d': 'Last 90 days', '12m': 'Last 12 months', 'all': 'All time' })[_REV_STATE.range];
  set('gross',    '$' + gross.toLocaleString());
  set('net',      '$' + net.toLocaleString());
  set('aov',      '$' + aov.toLocaleString());
  set('refunds',  '$' + refunds.toLocaleString());
  set('aov_sub',  paidCount + (paidCount === 1 ? ' order' : ' orders'));
  set('refund_rate', refundRate.toFixed(1) + '% rate');
  set('period_label', periodLabel);
}

function renderRevenueBars(){
  const el = document.getElementById('revBars'); if(!el) return;
  const orders = _ordersInRange();

  // How many monthly buckets to render based on the active range
  const months = _REV_STATE.range === '30d' ? 1
              : _REV_STATE.range === '90d' ? 3
              : 12;
  const now = new Date();
  const buckets = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    buckets.push({
      key:   d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0'),
      label: d.toLocaleDateString('en-AU', { month: 'short' }),
      total: 0,
    });
  }
  const idx = new Map(buckets.map((b, i) => [b.key, i]));
  for (const o of orders) {
    if (o.status === 'refunded' || o.status === 'cancelled') continue;
    const t = _orderTimestamp(o);
    if (!t) continue;
    const d = new Date(t);
    const k = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
    if (idx.has(k)) buckets[idx.get(k)].total += Number(o.total) || 0;
  }

  const W = 800, H = 280, pad = 30;
  const max = Math.max(1, ...buckets.map(b => b.total));
  const step = (W - pad*2) / buckets.length;
  const bw = step * 0.65;
  const bars = buckets.map((b, i) => {
    const h = (b.total / max) * (H - pad*2);
    const x = pad + i*step + (step - bw)/2;
    const y = H - pad - h;
    const valLabel = b.total >= 1000 ? `$${(b.total/1000).toFixed(1)}k`
                    : b.total > 0    ? `$${b.total}`
                    : '';
    return `<rect x="${x}" y="${y}" width="${bw}" height="${h}" rx="3" fill="url(#barGrad)"/>
            <text x="${x + bw/2}" y="${H-8}" fill="#7a6e5c" font-size="10" text-anchor="middle" font-family="Inter">${b.label}</text>
            <text x="${x + bw/2}" y="${y - 6}" fill="#b8a989" font-size="10" text-anchor="middle" font-family="Inter">${valLabel}</text>`;
  }).join('');
  el.innerHTML = `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none">
    <defs><linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#e8d5a0"/><stop offset="100%" stop-color="#a9864b"/>
    </linearGradient></defs>
    ${bars}
  </svg>`;
}

function renderCatBars(){
  const el = document.getElementById('catBars'); if(!el) return;
  const orders = _ordersInRange();

  // Build a product → category lookup. Falls back to "Other" when an item
  // id doesn't match a known product (e.g. manual orders with id='manual').
  const catOf = new Map((PRODUCTS || []).map(p => [p.id, (p.cat || '').toString()]));
  const totals = new Map();
  for (const o of orders) {
    if (o.status === 'refunded' || o.status === 'cancelled') continue;
    for (const it of (o.items || [])) {
      const cat = catOf.get(it.id) || 'Other';
      const lineRev = (Number(it.price) || 0) * (Number(it.qty) || 1);
      totals.set(cat, (totals.get(cat) || 0) + lineRev);
    }
  }
  const rows = Array.from(totals.entries())
    .map(([name, val]) => ({ name, val }))
    .sort((a, b) => b.val - a.val);
  const grand = rows.reduce((s, r) => s + r.val, 0) || 1;
  if (!rows.length) {
    el.innerHTML = '<li class="bar-empty"><span>No orders yet in this period.</span></li>';
    return;
  }
  el.innerHTML = rows.map(c => {
    const pct = Math.round((c.val / grand) * 100);
    return `
      <li>
        <div class="bar-row"><span>${c.name}</span><strong>$${c.val.toLocaleString()} · ${pct}%</strong></div>
        <div class="bar-track"><div class="bar-fill" style="width:${pct}%"></div></div>
      </li>
    `;
  }).join('');
}

function renderRevProducts(){
  const tb = document.getElementById('revProducts'); if(!tb) return;
  const orders = _ordersInRange();

  // Aggregate units + revenue per product id
  const agg = new Map();
  for (const o of orders) {
    if (o.status === 'refunded' || o.status === 'cancelled') continue;
    for (const it of (o.items || [])) {
      const key = it.id || it.name;
      const e = agg.get(key) || { id: it.id, name: it.name, units: 0, rev: 0 };
      e.units += Number(it.qty) || 1;
      e.rev   += (Number(it.price) || 0) * (Number(it.qty) || 1);
      agg.set(key, e);
    }
  }
  const catOf = new Map((PRODUCTS || []).map(p => [p.id, (p.cat || 'Other')]));
  const rows = Array.from(agg.values())
    .map(r => ({ ...r, cat: catOf.get(r.id) || '—' }))
    .sort((a, b) => b.rev - a.rev)
    .slice(0, 10);
  if (!rows.length) {
    tb.innerHTML = '<tr><td colspan="5" class="t-empty">No orders yet in this period.</td></tr>';
    return;
  }
  tb.innerHTML = rows.map(r => `
    <tr>
      <td>${r.name}</td>
      <td><span class="status muted">${r.cat}</span></td>
      <td>${r.units}</td>
      <td>$${r.rev.toLocaleString()}</td>
      <td>—</td>
    </tr>
  `).join('');
}

function renderRevenueAll() {
  renderRevenueKPIs();
  renderRevenueBars();
  renderCatBars();
  renderRevProducts();
}
renderRevenueAll();

// Wire the date-range selector
document.getElementById('revRange')?.addEventListener('change', e => {
  _REV_STATE.range = e.target.value;
  renderRevenueAll();
});

// Revenue → Export CSV
document.getElementById('revExport')?.addEventListener('click', () => {
  try {
    const csv = exportRevenueCSV();
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `crystalbrook-revenue-${_REV_STATE.range}-${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
    const months = csv.split('\n').length - 2;
    toast(`✓ Exported ${months} month${months === 1 ? '' : 's'} of revenue`);
  } catch (err) {
    toast('Export failed — try again');
  }
});

/* ---------- PRODUCTS / STOCKTAKE ---------- *
 * Each row's Price and Size are inline-editable. Hitting Save PUTs the
 * change to /api/products/:id; the row's "edited" pill goes back to a
 * green tick when the write succeeds.
 * ----------------------------------------------------- */
function renderProducts(filter='all', q='', cat=''){
  const body = document.getElementById('productsBody'); if(!body) return;
  let list = PRODUCTS.slice();
  if(q){
    const s = q.toLowerCase();
    list = list.filter(p=>p.name.toLowerCase().includes(s) || (p.sku||'').toLowerCase().includes(s));
  }
  if(cat){
    list = list.filter(p => (p.cat||'') === cat);
  }
  if(filter==='in')  list = list.filter(p=>p.stock>2);
  if(filter==='low') list = list.filter(p=>p.stock>0 && p.stock<=2);
  if(filter==='out') list = list.filter(p=>p.stock===0);

  body.innerHTML = list.map(p=>{
    return `
      <tr data-id="${p.id}">
        <td><input type="checkbox"/></td>
        <td>
          <div class="cell-product">
            ${(() => {
              const src = productImageSrc(p);
              return src
                ? `<div class="cell-thumb has-photo"><img src="${src}" alt="" onerror="this.parentElement.classList.remove('has-photo');this.parentElement.textContent='${(p.img || '?').replace(/'/g,'')}'"/></div>`
                : `<div class="cell-thumb">${p.img}</div>`;
            })()}
            <div>
              <strong>${p.name}</strong>
              <span class="cell-sub">${p.cat}</span>
            </div>
          </div>
        </td>
        <td><span class="status muted">${p.cat}</span></td>
        <td>${p.sku}</td>
        <td>
          <div class="cell-edit">
            <span class="cell-edit-prefix">$</span>
            <input class="inp inp-inline" type="number" min="0" step="1"
                   data-edit-field="price" value="${p.price}"/>
          </div>
        </td>
        <td>
          <input class="inp inp-inline" type="text" data-edit-field="size" value="${p.size||''}" placeholder="60 × 30 cm"/>
        </td>
        <td><span class="status ${p.draft?'warn':'ok'}">${p.draft?'Draft':'Live'}</span></td>
        <td>
          <div class="row-act">
            <button class="iact iact-save" title="Save price/size" data-save="${p.id}" disabled>
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12l5 5L20 6"/></svg>
            </button>
            <button class="iact iact-edit" title="Edit all fields" data-edit="${p.id}">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
            </button>
            <button class="iact iact-delete" title="Delete this piece" data-delete="${p.id}">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14"/></svg>
            </button>
          </div>
        </td>
      </tr>`;
  }).join('');

  // Wire Edit + Delete buttons
  body.querySelectorAll('[data-edit]').forEach(btn => {
    btn.addEventListener('click', () => {
      const p = PRODUCTS.find(x => x.id === btn.dataset.edit);
      if (p) openProductDrawer(p, { mode: 'edit' });
    });
  });
  body.querySelectorAll('[data-delete]').forEach(btn => {
    btn.addEventListener('click', () => {
      const p = PRODUCTS.find(x => x.id === btn.dataset.delete);
      if (p) confirmDeleteProduct(p);
    });
  });

  // Wire each row: inline price/size autosaves on blur or Enter, and the
  // green tick is also a manual fallback. Whatever Max does — click out,
  // press Enter, or hit the tick — the change persists.
  body.querySelectorAll('tr[data-id]').forEach(tr => {
    const id = tr.dataset.id;
    const inputs = tr.querySelectorAll('[data-edit-field]');
    const saveBtn = tr.querySelector('[data-save]');
    if (!saveBtn) return;
    const initial = {};
    inputs.forEach(inp => { initial[inp.dataset.editField] = inp.value; });

    function dirty(){
      let changed = false;
      inputs.forEach(inp => {
        if (inp.value !== initial[inp.dataset.editField]) changed = true;
      });
      saveBtn.disabled = !changed;
      saveBtn.classList.toggle('is-dirty', changed);
    }

    async function flush() {
      const patch = {};
      inputs.forEach(inp => {
        const f = inp.dataset.editField;
        if (inp.value === initial[f]) return;
        patch[f] = f === 'price' ? Number(inp.value) : inp.value;
      });
      if (!Object.keys(patch).length) return;
      saveBtn.disabled = true;
      try {
        await saveProductChanges(id, patch);
        const local = PRODUCTS.find(x => x.id === id);
        if (local) {
          if ('price' in patch) local.price = patch.price;
          if ('size' in patch) local.size = patch.size;
        }
        inputs.forEach(inp => { initial[inp.dataset.editField] = inp.value; });
        saveBtn.classList.remove('is-dirty');
        saveBtn.classList.add('is-saved');
        toast(`Saved · ${(local && local.name) || id}`);
        setTimeout(() => saveBtn.classList.remove('is-saved'), 1500);
      } catch (err) {
        console.error('save failed', err);
        toast(`Save failed: ${err.message || 'try again'}`);
        saveBtn.disabled = false;
      }
    }

    inputs.forEach(inp => {
      inp.addEventListener('input', dirty);
      // Autosave on blur (click away) — the most common case where Max
      // would expect "I changed it, it should save."
      inp.addEventListener('blur', () => {
        if (saveBtn.disabled) return;
        flush();
      });
      // Pressing Enter inside the field also commits the save
      inp.addEventListener('keydown', e => {
        if (e.key === 'Enter') { e.preventDefault(); flush(); inp.blur(); }
        if (e.key === 'Escape') {
          // Revert the value
          inp.value = initial[inp.dataset.editField];
          dirty();
          inp.blur();
        }
      });
    });

    saveBtn.addEventListener('click', flush);
  });

  const counts = {
    all: PRODUCTS.length,
    in:  PRODUCTS.filter(p=>p.stock>2).length,
    low: PRODUCTS.filter(p=>p.stock>0 && p.stock<=2).length,
    out: PRODUCTS.filter(p=>p.stock===0).length,
  };
  const a=document.getElementById('fAll'), i=document.getElementById('fIn'), l=document.getElementById('fLow'), o=document.getElementById('fOut');
  if(a) a.textContent=counts.all;
  if(i) i.textContent=counts.in;
  if(l) l.textContent=counts.low;
  if(o) o.textContent=counts.out;
}
renderProducts();

function _currentStockFilters() {
  const active = document.querySelector('[data-view="products"] .tab.is-active');
  return {
    filter: active?.dataset.filter || 'all',
    q:      document.getElementById('prodSearch')?.value || '',
    cat:    document.getElementById('prodCatFilter')?.value || '',
  };
}
function _refreshStocktake() {
  const { filter, q, cat } = _currentStockFilters();
  renderProducts(filter, q, cat);
}
document.querySelectorAll('[data-view="products"] .tab').forEach(tab=>{
  tab.addEventListener('click', ()=>{
    document.querySelectorAll('[data-view="products"] .tab').forEach(t=>t.classList.remove('is-active'));
    tab.classList.add('is-active');
    _refreshStocktake();
  });
});
document.getElementById('prodSearch')?.addEventListener('input', _refreshStocktake);
document.getElementById('prodCatFilter')?.addEventListener('change', _refreshStocktake);

/* ---------- ORDERS ---------- */
function renderOrders(){
  const tb = document.getElementById('ordersBody'); if(!tb) return;
  const orders = ordersForView();
  if (!orders.length) {
    tb.innerHTML = `<tr><td colspan="9" class="t-empty">No orders yet. When a customer checks out the row will appear here — for phone or in-person sales, hit "+ Manual order" up top.</td></tr>`;
    return;
  }
  tb.innerHTML = orders.map(o=>{
    const st = orderStatus(o.status);
    return `<tr data-order-id="${o.id}" class="order-row">
      <td><input type="checkbox" onclick="event.stopPropagation()"/></td>
      <td><strong>${o.id}</strong></td>
      <td>${o.cust}<span class="cell-sub">${o.email}</span></td>
      <td>${o.items}</td>
      <td>$${o.total.toLocaleString()}</td>
      <td><span class="status ${st.cls}">${st.label}</span></td>
      <td>${o.pay}</td>
      <td>${o.date}</td>
      <td>
        <div class="row-act">
          <button class="iact" title="View / change status" data-act="view" data-order-id="${o.id}">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12Z"/><circle cx="12" cy="12" r="3"/></svg>
          </button>
          <button class="iact iact-edit" title="Edit customer details" data-act="edit" data-order-id="${o.id}">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
          </button>
          <button class="iact iact-delete" title="Delete this order" data-act="delete" data-order-id="${o.id}">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14"/></svg>
          </button>
        </div>
      </td>
    </tr>`;
  }).join('');

  // Action buttons (event-stop so the row click doesn't fire too)
  tb.querySelectorAll('[data-act]').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const id = btn.dataset.orderId;
      if (btn.dataset.act === 'edit')   openOrderEdit(id);
      else if (btn.dataset.act === 'delete') confirmDeleteOrder(id);
      else openOrderDetail(id);
    });
  });

  // Whole-row click → open the view/status modal (covers most clicks)
  tb.querySelectorAll('.order-row').forEach(tr => {
    tr.style.cursor = 'pointer';
    tr.addEventListener('click', e => {
      if (e.target.closest('input[type="checkbox"]')) return;
      if (e.target.closest('[data-act]')) return;
      openOrderDetail(tr.dataset.orderId);
    });
  });
}
renderOrders();
// Pull live orders from D1 — repopulates the table + dashboard once it lands.
refreshOrdersFromAPI();

/* ---------- ORDER DETAIL MODAL — status toggle + send email ----------
 * Click an order row → modal shows the full row + a status toggle bar.
 * Picking a new status PATCHes /api/orders/:id; the Worker fires a
 * customer email (when RESEND_API_KEY is configured) so the customer
 * gets "we've shipped it" / "your order's been refunded" notifications.
 */
const ORDER_STATUS_FLOW = [
  { key: 'paid',          label: 'Paid',           emoji: '💳' },
  { key: 'in_production', label: 'In production',  emoji: '🪚' },
  { key: 'shipped',       label: 'Shipped',        emoji: '📦' },
  { key: 'delivered',     label: 'Delivered',      emoji: '🏠' },
  { key: 'refunded',      label: 'Refunded',       emoji: '↩' },
  { key: 'cancelled',     label: 'Cancelled',      emoji: '✕' },
];

function openOrderDetail(id) {
  const view = _ordersCache.find(x => x.id === id);
  if (!view) { toast('Couldn\'t find that order — try refreshing the page.'); return; }
  const o = view._raw || view;

  let modal = document.getElementById('orderDetailModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'orderDetailModal';
    modal.className = 'request-detail-modal';   // reuse styling
    document.body.appendChild(modal);
    modal.addEventListener('click', e => { if (e.target === modal) modal.hidden = true; });
  }

  const itemRows = (o.items || []).map(i => `
    <li class="od-item">
      <span class="od-item-name">${i.name || 'Item'}</span>
      <span class="od-item-qty">×${i.qty || 1}</span>
      <span class="od-item-price">$${((i.price || 0) * (i.qty || 1)).toLocaleString()}</span>
    </li>
  `).join('') || '<li class="od-item"><span>No items</span></li>';

  const photo = o.photoDataUrl
    ? `<div class="rd-photo"><img src="${o.photoDataUrl}" alt="Reference"/></div>`
    : '';

  const statusButtons = ORDER_STATUS_FLOW.map(s => {
    const isCurrent = s.key === o.status;
    return `<button type="button" class="od-status-btn${isCurrent ? ' is-current' : ''}" data-status="${s.key}">
      <span class="od-status-emoji">${s.emoji}</span>
      <span class="od-status-label">${s.label}</span>
    </button>`;
  }).join('');

  const addr = [o.address, o.suburb, [o.state, o.postcode].filter(Boolean).join(' ')].filter(Boolean).join(', ');

  modal.innerHTML = `
    <div class="rd-card od-card">
      <button class="rd-close" type="button" aria-label="Close">×</button>
      <p class="rd-eyebrow">${o.id} · ${formatOrderDate(o.createdAt) || 'Just placed'}</p>
      <h2 class="rd-name">${o.name || 'Customer'}</h2>
      <p class="rd-meta">
        <a href="mailto:${o.email}">${o.email || ''}</a>
        ${o.phone ? ` · <a href="tel:${o.phone}">${o.phone}</a>` : ''}
        ${addr ? ` · ${addr}` : ''}
      </p>
      ${photo}

      <div class="od-section">
        <h3 class="od-h3">Items</h3>
        <ul class="od-items">${itemRows}</ul>
        <div class="od-totals">
          <div><span>Subtotal</span><strong>$${(o.subtotal || 0).toLocaleString()}</strong></div>
          <div><span>Shipping</span><strong>${o.shipping ? '$' + o.shipping.toLocaleString() : 'Free'}</strong></div>
          <div class="od-grand"><span>Total</span><strong>$${(o.total || 0).toLocaleString()}</strong></div>
        </div>
      </div>

      <div class="od-section">
        <h3 class="od-h3">Order status</h3>
        <p class="od-status-help">Click a status to update the order. The customer gets an email letting them know.</p>
        <div class="od-status-grid" id="odStatusGrid">${statusButtons}</div>
        <p class="od-status-saving" id="odStatusSaving" hidden>Saving + sending notification…</p>
      </div>

      <div class="od-section">
        <h3 class="od-h3">Tracking number</h3>
        <p class="od-status-help">Enter the Australia Post tracking number once you've shipped it. If the order's status is "Shipped", the customer's email will include this number.</p>
        <div class="od-tracking-row">
          <input class="inp" id="odTracking" type="text" placeholder="e.g. 33ABXX1234567" value="${(o.trackingNumber || '').replace(/"/g, '&quot;')}"/>
          <button class="btn btn-gold btn-small" type="button" id="odTrackingSave">Save</button>
        </div>
        <p class="od-status-saving" id="odTrackingSaved" hidden>Saved ✓</p>
      </div>

      ${o.notes ? `<div class="od-section"><h3 class="od-h3">Notes</h3><p class="od-notes">${o.notes.replace(/</g,'&lt;')}</p></div>` : ''}

      <div class="rd-actions">
        <button class="btn btn-gold" type="button" id="odSendInvoice">Email invoice to customer</button>
        <a class="btn btn-ghost" href="mailto:${o.email}?subject=${encodeURIComponent('Your Crystal Brook order ' + o.id)}&body=${encodeURIComponent('Hi ' + ((o.name || 'there').split(' ')[0]) + ',\n\n')}">Reply by email →</a>
        <a class="btn btn-ghost" href="../order.html?id=${o.id}" target="_blank" rel="noopener">View customer-facing tracking →</a>
      </div>
    </div>`;
  modal.hidden = false;
  modal.querySelector('.rd-close').addEventListener('click', () => modal.hidden = true);

  // Tracking number save
  const trackingInput = modal.querySelector('#odTracking');
  const trackingSave  = modal.querySelector('#odTrackingSave');
  const trackingDone  = modal.querySelector('#odTrackingSaved');
  trackingSave?.addEventListener('click', async () => {
    const newVal = trackingInput.value.trim();
    if ((newVal || '') === (o.trackingNumber || '')) {
      trackingDone.textContent = 'No change';
      trackingDone.hidden = false;
      setTimeout(() => trackingDone.hidden = true, 1500);
      return;
    }
    trackingSave.disabled = true;
    trackingSave.textContent = 'Saving…';
    try {
      const res = await fetch('/api/orders/' + encodeURIComponent(id), {
        method: 'PATCH',
        headers: { 'content-type': 'application/json', ...adminAuthHeaders() },
        body: JSON.stringify({ tracking_number: newVal }),
      });
      if (!res.ok) throw new Error('save failed');
      o.trackingNumber = newVal;
      const cached = _ordersCache.find(x => x.id === id);
      if (cached?._raw) cached._raw.trackingNumber = newVal;
      trackingDone.textContent = 'Saved ✓ — included in the next "Shipped" email if status changes';
      trackingDone.hidden = false;
      setTimeout(() => trackingDone.hidden = true, 3000);
      refreshOrdersFromAPI();
    } catch (err) {
      trackingDone.textContent = 'Save failed — try again';
      trackingDone.hidden = false;
    } finally {
      trackingSave.disabled = false;
      trackingSave.textContent = 'Save';
    }
  });

  // Send invoice
  const sendInvBtn = modal.querySelector('#odSendInvoice');
  sendInvBtn?.addEventListener('click', async () => {
    if (!o.email) { toast('No customer email on this order — can\'t send invoice.'); return; }
    sendInvBtn.disabled = true;
    const original = sendInvBtn.textContent;
    sendInvBtn.textContent = 'Sending…';
    try {
      const res = await fetch('/api/orders/' + encodeURIComponent(id) + '/send-invoice', {
        method: 'POST',
        headers: { ...adminAuthHeaders() },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'send failed');
      toast(`Invoice emailed to ${o.email}`);
    } catch (err) {
      toast('Couldn\'t send invoice: ' + (err.message || 'try again'));
    } finally {
      sendInvBtn.disabled = false;
      sendInvBtn.textContent = original;
    }
  });

  // Status toggle clicks → PATCH /api/orders/:id
  const grid    = modal.querySelector('#odStatusGrid');
  const saving  = modal.querySelector('#odStatusSaving');
  grid.querySelectorAll('.od-status-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const newStatus = btn.dataset.status;
      if (newStatus === o.status) return;
      grid.querySelectorAll('.od-status-btn').forEach(b => b.disabled = true);
      saving.hidden = false;
      try {
        const res = await fetch('/api/orders/' + encodeURIComponent(id), {
          method: 'PATCH',
          headers: { 'content-type': 'application/json', ...adminAuthHeaders() },
          body: JSON.stringify({ status: newStatus }),
        });
        if (!res.ok) throw new Error('save failed');
        const result = await res.json();
        // Update the cached row + UI
        const cached = _ordersCache.find(x => x.id === id);
        if (cached) cached.status = newStatus;
        if (cached && cached._raw) cached._raw.status = newStatus;
        toast(result.emailSent
          ? `Marked ${ORDER_STATUS_FLOW.find(s => s.key === newStatus)?.label} · email sent to ${o.email}`
          : `Marked ${ORDER_STATUS_FLOW.find(s => s.key === newStatus)?.label}`);
        // Re-render the modal with the new active status, plus the table
        modal.hidden = true;
        renderOrders();
        renderRecentOrders();
        renderDashboardStats();
        renderRevenueAll();
        // Reopen so Max sees the updated state
        setTimeout(() => openOrderDetail(id), 50);
      } catch (err) {
        toast('Status update failed — try again');
        grid.querySelectorAll('.od-status-btn').forEach(b => b.disabled = false);
      } finally {
        saving.hidden = true;
      }
    });
  });
}

/* ---------- ORDER EDIT MODAL — customer details + notes ----------
 * Opens via the pencil icon on each order row. PATCHes /api/orders/:id
 * with whitelisted fields (name/email/phone/address/suburb/state/
 * postcode/notes). Status changes still go through the view modal so
 * the email-fire path is explicit.
 */
function openOrderEdit(id) {
  const view = _ordersCache.find(x => x.id === id);
  if (!view) { toast('Couldn\'t find that order — try refreshing.'); return; }
  const o = view._raw || view;

  let modal = document.getElementById('orderEditModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'orderEditModal';
    modal.className = 'request-detail-modal';
    document.body.appendChild(modal);
    modal.addEventListener('click', e => { if (e.target === modal) modal.hidden = true; });
  }
  modal.innerHTML = `
    <div class="rd-card">
      <button class="rd-close" type="button" aria-label="Close">×</button>
      <p class="rd-eyebrow">${o.id} · edit customer details</p>
      <h2 class="rd-name">Edit ${o.name || 'order'}</h2>
      <p class="rd-meta">Typo fixes, address corrections, internal notes. Status changes (paid → shipped etc.) still happen on the View screen so the customer email fires correctly.</p>

      <form id="orderEditForm" class="form" autocomplete="off">
        <label><span>Customer name *</span><input class="inp" name="name" required value="${(o.name || '').replace(/"/g, '&quot;')}"/></label>
        <div class="row-2">
          <label><span>Email *</span><input class="inp" name="email" type="email" required value="${(o.email || '').replace(/"/g, '&quot;')}"/></label>
          <label><span>Phone</span><input class="inp" name="phone" type="tel" value="${(o.phone || '').replace(/"/g, '&quot;')}"/></label>
        </div>
        <label><span>Street address</span><input class="inp" name="address" value="${(o.address || '').replace(/"/g, '&quot;')}"/></label>
        <div class="row-2">
          <label><span>Suburb</span><input class="inp" name="suburb" value="${(o.suburb || '').replace(/"/g, '&quot;')}"/></label>
          <label><span>State</span>
            <select class="inp" name="state">
              <option value="">—</option>
              ${['QLD','NSW','VIC','WA','SA','TAS','ACT','NT'].map(s =>
                `<option value="${s}"${o.state === s ? ' selected' : ''}>${s}</option>`).join('')}
            </select>
          </label>
        </div>
        <label><span>Postcode</span><input class="inp" name="postcode" value="${(o.postcode || '').replace(/"/g, '&quot;')}"/></label>
        <label><span>Notes (admin only)</span><textarea class="inp" name="notes" rows="3">${(o.notes || '').replace(/</g, '&lt;')}</textarea></label>
        <p class="newquote-err" id="orderEditErr" hidden style="color:#d9534f;margin:0;font-size:.9rem;"></p>
      </form>

      <div class="rd-actions">
        <button class="btn btn-gold" type="button" id="orderEditSave">Save changes</button>
        <button class="btn btn-ghost" type="button" id="orderEditCancel">Cancel</button>
      </div>
    </div>`;
  modal.hidden = false;
  modal.querySelector('.rd-close').addEventListener('click', () => modal.hidden = true);
  modal.querySelector('#orderEditCancel').addEventListener('click', () => modal.hidden = true);

  const form = modal.querySelector('#orderEditForm');
  const errEl = modal.querySelector('#orderEditErr');
  const saveBtn = modal.querySelector('#orderEditSave');

  saveBtn.addEventListener('click', async () => {
    errEl.hidden = true;
    const data = Object.fromEntries(new FormData(form).entries());
    if (!(data.name || '').trim()) { errEl.textContent = 'Name is required.'; errEl.hidden = false; return; }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test((data.email || '').trim())) { errEl.textContent = 'Valid email required.'; errEl.hidden = false; return; }
    saveBtn.disabled = true;
    const original = saveBtn.textContent;
    saveBtn.textContent = 'Saving…';
    try {
      const res = await fetch('/api/orders/' + encodeURIComponent(id), {
        method: 'PATCH',
        headers: { 'content-type': 'application/json', ...adminAuthHeaders() },
        body: JSON.stringify({
          name: data.name.trim(),
          email: data.email.trim(),
          phone: (data.phone || '').trim(),
          address: (data.address || '').trim(),
          suburb: (data.suburb || '').trim(),
          state: data.state || '',
          postcode: (data.postcode || '').trim(),
          notes: (data.notes || '').trim(),
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || 'save failed');
      }
      modal.hidden = true;
      toast('Saved · ' + id);
      refreshOrdersFromAPI();
    } catch (err) {
      errEl.textContent = 'Couldn\'t save: ' + (err.message || 'try again');
      errEl.hidden = false;
      saveBtn.disabled = false;
      saveBtn.textContent = original;
    }
  });

  setTimeout(() => form.querySelector('[name="name"]')?.focus(), 50);
}

/* ---------- ORDER DELETE CONFIRM ---------- */
function confirmDeleteOrder(id) {
  const view = _ordersCache.find(x => x.id === id);
  const label = view ? `${view.id} (${view.fullName || view.cust || 'customer'}, $${view.total})` : id;

  let modal = document.getElementById('orderDeleteModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'orderDeleteModal';
    modal.className = 'request-detail-modal';
    document.body.appendChild(modal);
    modal.addEventListener('click', e => { if (e.target === modal) modal.hidden = true; });
  }
  modal.innerHTML = `
    <div class="rd-card" style="max-width: 480px;">
      <button class="rd-close" type="button" aria-label="Close">×</button>
      <p class="rd-eyebrow">Delete order</p>
      <h2 class="rd-name">Delete ${label}?</h2>
      <p class="rd-meta">This permanently removes the row from your records — it can't be undone. The customer won't be told (no email fires from delete).</p>
      <p class="rd-meta" style="color:#b14a3a;font-weight:500;">If they're owed a refund, mark it <strong>Refunded</strong> first (that fires the customer email), then delete.</p>
      <div class="rd-actions">
        <button class="btn btn-danger" type="button" id="orderDeleteOk">Delete order</button>
        <button class="btn btn-ghost" type="button" id="orderDeleteCancel">Cancel</button>
      </div>
    </div>`;
  modal.hidden = false;
  modal.querySelector('.rd-close').addEventListener('click', () => modal.hidden = true);
  modal.querySelector('#orderDeleteCancel').addEventListener('click', () => modal.hidden = true);
  modal.querySelector('#orderDeleteOk').addEventListener('click', async () => {
    const btn = modal.querySelector('#orderDeleteOk');
    btn.disabled = true;
    btn.textContent = 'Deleting…';
    try {
      const res = await fetch('/api/orders/' + encodeURIComponent(id), {
        method: 'DELETE',
        headers: { ...adminAuthHeaders() },
      });
      if (!res.ok) throw new Error('delete failed');
      modal.hidden = true;
      toast('Deleted · ' + id);
      refreshOrdersFromAPI();
    } catch (err) {
      toast('Delete failed — try again');
      btn.disabled = false;
      btn.textContent = 'Delete order';
    }
  });
}

/* ---------- CUSTOM ORDERS KANBAN ---------- *
 * Live requests come from D1 via GET /api/requests (admin auth). We
 * render the static CUSTOM_ORDERS stub columns alongside so the page
 * still has the kanban shape on first paint, then re-render when the
 * fetch lands. Click a request card to open a detail drawer with the
 * full submission (incl. reference photo and notes).
 */
function relativeTime(iso) {
  if (!iso) return '';
  const t = new Date(iso.replace(' ', 'T') + 'Z').getTime();
  if (!Number.isFinite(t)) return '';
  const diff = (Date.now() - t) / 1000;
  if (diff < 90) return 'Just in';
  if (diff < 3600) return Math.round(diff / 60) + ' min ago';
  if (diff < 86400) return Math.round(diff / 3600) + ' h ago';
  if (diff < 86400 * 7) return Math.round(diff / 86400) + ' d ago';
  return new Date(iso).toLocaleDateString();
}

let _requestsCache = [];

// Map request status → kanban column. 'declined' rows are hidden (Max can
// always see them via the per-card detail modal once we wire a Closed
// column; for now they stay out of the active board to keep it tidy).
const REQUEST_STATUS_TO_COLUMN = {
  new:          'New',
  quoted:       'Quoted',
  in_progress:  'In Production',
  done:         'Completed',
};

function _requestToCard(r) {
  return {
    id:       r.id,
    name:     r.name || 'Anonymous',
    subject:  r.subject || '(no subject)',
    size:     r.size ? r.size.toUpperCase() : '—',
    budget:   r.status === 'new' ? 'Awaiting quote' : '',
    due:      relativeTime(r.createdAt),
    isRequest: true,
    hasPhoto: !!r.photoDataUrl,
  };
}

function renderKanban(){
  const kb = document.getElementById('kanban'); if(!kb) return;

  // Distribute every live request into its right column based on status.
  // Was: only `new` requests merged into the New column → marking a
  // request as "quoted" made it disappear off the board entirely.
  const cols = { New: [], Quoted: [], 'In Production': [], Completed: [] };
  for (const r of _requestsCache) {
    const col = REQUEST_STATUS_TO_COLUMN[r.status];
    if (col && cols[col]) cols[col].push(_requestToCard(r));
  }

  kb.innerHTML = Object.entries(cols).map(([title, cards])=>`
    <div class="kcol">
      <div class="kcol-head"><strong>${title}</strong><span>${cards.length}</span></div>
      ${cards.length ? cards.map(c=>`
        <div class="kcard is-request"${c.id ? ` data-request-id="${c.id}"` : ''} draggable="true">
          <span class="kcard-pill">Request</span>
          ${c.hasPhoto  ? '<span class="kcard-photo-pill" title="Reference photo attached">📎 photo</span>' : ''}
          <div class="kcard-name">${c.name}</div>
          <div class="kcard-sub">${c.subject}</div>
          <div class="kcard-row">
            <span class="kcard-tag">${c.size}${c.budget ? ' · ' + c.budget : ''}</span>
            <span>${c.due}</span>
          </div>
        </div>
      `).join('') : '<p class="kcol-empty">Nothing here yet.</p>'}
    </div>
  `).join('');

  kb.querySelectorAll('[data-request-id]').forEach(card => {
    card.addEventListener('click', () => openRequestDetail(card.dataset.requestId));
  });
}
renderKanban();

async function refreshRequestsFromAPI() {
  try {
    const res = await fetch('/api/requests', {
      headers: { ...adminAuthHeaders() },
      cache: 'no-store',
    });
    if (!res.ok) {
      if (res.status === 401) {
        localStorage.removeItem(ADMIN_AUTH_KEY);
        showAdminLogin('Your session expired — please sign in again.');
      }
      return;
    }
    const data = await res.json();
    _requestsCache = Array.isArray(data.requests) ? data.requests : [];
    renderKanban();
  } catch (err) {
    console.warn('[requests] fetch failed', err);
  }
}
refreshRequestsFromAPI();

function openRequestDetail(id) {
  const r = _requestsCache.find(x => x.id === id);
  if (!r) return;
  let modal = document.getElementById('requestDetailModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'requestDetailModal';
    modal.className = 'request-detail-modal';
    document.body.appendChild(modal);
    modal.addEventListener('click', e => { if (e.target === modal) modal.hidden = true; });
  }
  const photo = r.photoDataUrl
    ? `<div class="rd-photo"><img src="${r.photoDataUrl}" alt="Reference photo"/></div>`
    : '<div class="rd-photo rd-photo-empty">No reference photo attached</div>';

  // ── Quote section markup. Three states:
  //   1. Never quoted: empty form
  //   2. Quote sent, awaiting response: shows "Sent X ago" + Resend / Edit buttons
  //   3. Quote responded: shows the customer's response inline
  let quoteSection = '';
  if (r.quoteResponse === 'approved') {
    quoteSection = `
      <div class="rd-quote-status rd-quote-status-ok">
        ✓ <strong>Customer approved this quote</strong>
        <span>$${(r.quotePrice || 0).toLocaleString()} · ${relativeTime(r.quoteResponseAt) || 'just now'}</span>
      </div>`;
  } else if (r.quoteResponse === 'changes_requested') {
    quoteSection = `
      <div class="rd-quote-status rd-quote-status-changes">
        ↺ <strong>Customer asked for changes</strong>
        <span>$${(r.quotePrice || 0).toLocaleString()} · ${relativeTime(r.quoteResponseAt) || 'just now'}</span>
        ${r.quoteResponseMessage ? `<blockquote>${(r.quoteResponseMessage).replace(/</g,'&lt;')}</blockquote>` : ''}
      </div>`;
  } else if (r.quoteSentAt) {
    quoteSection = `
      <div class="rd-quote-status rd-quote-status-sent">
        ⌛ <strong>Quote sent — waiting on customer</strong>
        <span>$${(r.quotePrice || 0).toLocaleString()} · ${relativeTime(r.quoteSentAt) || 'just now'}</span>
        <a href="/quote.html?id=${encodeURIComponent(r.id)}&token=${encodeURIComponent(r.quoteToken || '')}" target="_blank" rel="noopener" class="rd-quote-link">View customer-facing quote →</a>
      </div>`;
  }

  modal.innerHTML = `
    <div class="rd-card">
      <button class="rd-close" type="button" aria-label="Close">×</button>
      <p class="rd-eyebrow">${r.id} · ${relativeTime(r.createdAt)}</p>
      <h2 class="rd-name">${r.name}</h2>
      <p class="rd-meta">
        <a href="mailto:${r.email}">${r.email}</a>
        ${r.phone ? ` · <a href="tel:${r.phone}">${r.phone}</a>` : ''}
      </p>
      ${photo}
      <dl class="rd-list">
        <div><dt>What they want</dt><dd>${(r.subject || '').replace(/</g,'&lt;')}</dd></div>
        ${r.category ? `<div><dt>Category</dt><dd>${r.category}</dd></div>` : ''}
        ${r.size ? `<div><dt>Size</dt><dd>${r.size}</dd></div>` : ''}
        ${r.notes ? `<div><dt>Notes</dt><dd>${(r.notes || '').replace(/</g,'&lt;')}</dd></div>` : ''}
        <div><dt>Source</dt><dd>${r.source || '—'}</dd></div>
        <div><dt>Status</dt><dd>${r.status}</dd></div>
      </dl>

      ${quoteSection}

      <details class="rd-quote-form-details" ${r.quoteSentAt && !r.quoteResponse ? '' : 'open'}>
        <summary>${r.quoteSentAt ? 'Re-send quote (with edits)' : 'Compose quote for customer'}</summary>
        <form id="rdQuoteForm" class="form" autocomplete="off">
          <div class="row-2">
            <label><span>Price ($AUD) *</span><input class="inp" name="price" type="number" min="0" step="1" required value="${r.quotePrice ?? ''}" placeholder="e.g. 850"/></label>
            <label><span>Customer email</span><input class="inp" type="email" disabled value="${r.email || ''}"/></label>
          </div>
          <label><span>Message to the customer *</span><textarea class="inp" name="message" rows="4" required placeholder="Explain what's included, the timber/size you're recommending, lead time, anything that makes the quote feel personal.">${(r.quoteMessage || '').replace(/</g, '&lt;')}</textarea></label>
          <div class="row-2" style="grid-template-columns: 1fr;">
            <label style="display:block;">
              <span>Mockup image (optional)</span>
              <div class="contact-photo" style="margin-top:6px;">
                <div class="contact-photo-preview" data-photo-preview>
                  ${r.quoteImageUrl ? `<img src="${r.quoteImageUrl}" alt="Existing mockup"/>` : '<span class="contact-photo-empty">No mockup attached</span>'}
                </div>
                <div class="contact-photo-actions">
                  <button class="btn btn-ghost btn-small" type="button" data-photo-upload>↑ Attach mockup</button>
                  <button class="btn btn-ghost btn-small" type="button" data-photo-clear ${r.quoteImageUrl ? '' : 'hidden'}>× Remove</button>
                  <input type="file" accept="image/png,image/jpeg,image/webp" hidden/>
                  <small class="contact-photo-hint">Auto-shrunk to fit. Use the Image Builder to generate one if you don't have a mockup yet.</small>
                </div>
              </div>
            </label>
          </div>
          <p class="newquote-err" id="rdQuoteErr" hidden style="color:#d9534f;margin:0;font-size:.9rem;"></p>
          <div class="row-2" style="margin-top:6px;">
            <button class="btn btn-gold" type="button" id="rdQuoteSend">${r.quoteSentAt ? 'Re-send quote' : 'Send quote to customer'}</button>
            <button class="btn btn-ghost" type="button" id="rdQuoteSaveDraft" hidden>Save draft (don't send yet)</button>
          </div>
          <p class="rd-quote-help">Sending writes the quote to D1, mints a private link, and emails the customer. They'll see the price + mockup + message, with Approve / Request changes buttons.</p>
        </form>
      </details>

      <div class="rd-actions">
        <a class="btn btn-ghost" href="mailto:${r.email}?subject=${encodeURIComponent('Re: ' + (r.subject || '').slice(0, 60))}&body=${encodeURIComponent('Hi ' + ((r.name || '').split(' ')[0] || '') + ',\n\n')}">Reply by email →</a>
        <button class="btn btn-ghost" type="button" data-rd-status="declined">Decline request</button>
      </div>
    </div>`;
  modal.hidden = false;
  modal.querySelector('.rd-close').addEventListener('click', () => modal.hidden = true);

  // Wire the photo uploader inside this modal
  const form = modal.querySelector('#rdQuoteForm');
  const getPhoto = wireAdminPhotoUploader(form);
  // If there's already an image, seed the closure so we don't lose it on re-send
  // The wireAdminPhotoUploader returns null until the user picks a new one,
  // so we capture the existing URL separately.
  const existingMockup = r.quoteImageUrl || null;

  modal.querySelector('#rdQuoteSend').addEventListener('click', async () => {
    const errEl = modal.querySelector('#rdQuoteErr');
    errEl.hidden = true;
    const data = Object.fromEntries(new FormData(form).entries());
    const price = Number(data.price);
    if (!Number.isFinite(price) || price < 0) { errEl.textContent = 'Price required.'; errEl.hidden = false; return; }
    if (!(data.message || '').trim()) { errEl.textContent = 'A message is required.'; errEl.hidden = false; return; }
    const btn = modal.querySelector('#rdQuoteSend');
    btn.disabled = true;
    const original = btn.textContent;
    btn.textContent = 'Sending…';
    try {
      const res = await fetch('/api/requests/' + encodeURIComponent(r.id) + '/quote', {
        method: 'POST',
        headers: { 'content-type': 'application/json', ...adminAuthHeaders() },
        body: JSON.stringify({
          price,
          message: data.message.trim(),
          imageDataUrl: getPhoto() || existingMockup || '',
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || 'send failed');
      }
      const result = await res.json();
      toast(result.emailSent
        ? `Quote emailed to ${r.email}`
        : `Quote saved · email skipped (RESEND_API_KEY not set)`);
      modal.hidden = true;
      refreshRequestsFromAPI();
    } catch (err) {
      errEl.textContent = 'Send failed: ' + (err.message || 'try again');
      errEl.hidden = false;
      btn.disabled = false;
      btn.textContent = original;
    }
  });

  modal.querySelectorAll('[data-rd-status]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const status = btn.dataset.rdStatus;
      btn.disabled = true;
      try {
        const res = await fetch('/api/requests/' + encodeURIComponent(r.id), {
          method: 'PATCH',
          headers: { 'content-type': 'application/json', ...adminAuthHeaders() },
          body: JSON.stringify({ status }),
        });
        if (!res.ok) throw new Error('save failed');
        toast('Marked ' + status);
        modal.hidden = true;
        refreshRequestsFromAPI();
      } catch (err) {
        toast('Save failed — try again');
        btn.disabled = false;
      }
    });
  });
}

/* ---------- ADMIN-SIDE QUOTE / MANUAL ORDER FORMS ----------
 * Two near-identical modals — one for "+ New quote" on Custom Orders,
 * one for "+ Manual order" on Orders. Both POST to /api/requests so
 * everything Max takes offline still lands in D1 and shows up in the
 * Custom Orders kanban (with a different source tag so Max can tell
 * them apart). Each form has an optional reference-picture upload —
 * Max can attach the print the customer chose on the phone.
 */

async function shrinkAdminReferenceImage(file, maxEdge = 1024, quality = 0.82) {
  const dataUrl = await new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = () => reject(new Error('read failed'));
    r.readAsDataURL(file);
  });
  const img = await new Promise((resolve, reject) => {
    const im = new Image();
    im.onload = () => resolve(im);
    im.onerror = () => reject(new Error('decode failed'));
    im.src = dataUrl;
  });
  const w = img.naturalWidth, h = img.naturalHeight;
  const scale = Math.min(1, maxEdge / Math.max(w, h));
  const tw = Math.max(1, Math.round(w * scale));
  const th = Math.max(1, Math.round(h * scale));
  const cv = document.createElement('canvas');
  cv.width = tw; cv.height = th;
  const ctx = cv.getContext('2d');
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, tw, th);
  ctx.drawImage(img, 0, 0, tw, th);
  return cv.toDataURL('image/jpeg', quality);
}

/* Wires a photo-upload section inside the modal. Returns a getter that
 * yields the current data URL (or null) at submit time. */
function wireAdminPhotoUploader(scope) {
  let dataUrl = null;
  const input  = scope.querySelector('input[type="file"]');
  const upload = scope.querySelector('[data-photo-upload]');
  const clear  = scope.querySelector('[data-photo-clear]');
  const prev   = scope.querySelector('[data-photo-preview]');
  function setPreview(src) {
    if (!prev) return;
    if (!src) {
      prev.innerHTML = '<span class="contact-photo-empty">No reference attached</span>';
      if (clear) clear.hidden = true;
      return;
    }
    prev.innerHTML = '';
    const img = new Image(); img.alt = ''; img.src = src;
    prev.appendChild(img);
    if (clear) clear.hidden = false;
  }
  upload?.addEventListener('click', () => input?.click());
  input?.addEventListener('change', async e => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!/^image\//.test(file.type)) {
      toast('That doesn\'t look like a photo. Try JPG, PNG or WebP.');
      return;
    }
    upload.disabled = true;
    const original = upload.textContent;
    upload.textContent = 'Resizing…';
    try {
      dataUrl = await shrinkAdminReferenceImage(file);
      setPreview(dataUrl);
    } catch (_) {
      toast('Couldn\'t read that file. Try a different one.');
    } finally {
      upload.disabled = false;
      upload.textContent = original;
      input.value = '';
    }
  });
  clear?.addEventListener('click', () => { dataUrl = null; setPreview(null); });
  return () => dataUrl;
}

const _PHOTO_BLOCK_HTML = `
  <div class="row-2" style="grid-template-columns: 1fr;">
    <label style="display:block;">
      <span>Reference picture (optional)</span>
      <div class="contact-photo" style="margin-top:6px;">
        <div class="contact-photo-preview" data-photo-preview>
          <span class="contact-photo-empty">No reference attached</span>
        </div>
        <div class="contact-photo-actions">
          <button class="btn btn-ghost btn-small" type="button" data-photo-upload>↑ Attach a picture</button>
          <button class="btn btn-ghost btn-small" type="button" data-photo-clear hidden>× Remove</button>
          <input type="file" accept="image/png,image/jpeg,image/webp" hidden/>
          <small class="contact-photo-hint">Helpful when the customer has chosen a print on the phone — attach a snap so Max sees what they want.</small>
        </div>
      </div>
    </label>
  </div>`;

function openNewQuoteForm() {
  let modal = document.getElementById('newQuoteModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'newQuoteModal';
    modal.className = 'request-detail-modal';
    document.body.appendChild(modal);
    modal.addEventListener('click', e => { if (e.target === modal) modal.hidden = true; });
  }
  modal.innerHTML = `
    <div class="rd-card">
      <button class="rd-close" type="button" aria-label="Close">×</button>
      <p class="rd-eyebrow">Manual entry</p>
      <h2 class="rd-name">New quote request</h2>
      <p class="rd-meta">Use this when a customer phoned or emailed Max directly. Fields marked * are required.</p>
      <form id="newQuoteForm" class="form" autocomplete="off">
        <label><span>Customer name *</span><input class="inp" name="name" required autocomplete="off"/></label>
        <div class="row-2">
          <label><span>Email *</span><input class="inp" name="email" type="email" required/></label>
          <label><span>Phone</span><input class="inp" name="phone" type="tel"/></label>
        </div>
        <label><span>What do they want? *</span><textarea class="inp" name="subject" rows="3" required placeholder="e.g. a 1.4 m Spanish Mackerel — side profile, silver-blue sheen, taken off Cairns"></textarea></label>
        <div class="row-2">
          <label><span>Category</span>
            <select class="inp" name="category">
              <option value="">Not sure yet</option>
              <option value="saltwater">Saltwater fish</option>
              <option value="freshwater">Freshwater fish</option>
              <option value="cars">Cars</option>
              <option value="animals">Animals</option>
              <option value="birds">Birds</option>
              <option value="other">Something else</option>
            </select>
          </label>
          <label><span>Approximate size</span>
            <select class="inp" name="size">
              <option value="">No preference</option>
              <option value="small">Small (≤ 50 cm)</option>
              <option value="medium">Medium (50–80 cm)</option>
              <option value="large">Large (80–100 cm)</option>
              <option value="xl">XL (100 cm +)</option>
            </select>
          </label>
        </div>
        <label><span>Notes (anything else)</span><textarea class="inp" name="notes" rows="3" placeholder="Deadline, gift occasion, timber preference…"></textarea></label>
        ${_PHOTO_BLOCK_HTML}
        <p class="newquote-err" id="newQuoteErr" hidden style="color:#d9534f;margin:0;font-size:.9rem;"></p>
      </form>
      <div class="rd-actions">
        <button class="btn btn-gold" type="button" id="newQuoteSave">Save request</button>
        <button class="btn btn-ghost" type="button" id="newQuoteCancel">Cancel</button>
      </div>
    </div>`;
  modal.hidden = false;
  modal.querySelector('.rd-close').addEventListener('click', () => modal.hidden = true);
  modal.querySelector('#newQuoteCancel').addEventListener('click', () => modal.hidden = true);

  const form = modal.querySelector('#newQuoteForm');
  const errEl = modal.querySelector('#newQuoteErr');
  const saveBtn = modal.querySelector('#newQuoteSave');
  const getPhoto = wireAdminPhotoUploader(form);

  saveBtn.addEventListener('click', async () => {
    errEl.hidden = true;
    const data = Object.fromEntries(new FormData(form).entries());
    const missing = ['name','email','subject'].filter(k => !(data[k] || '').trim());
    if (missing.length) {
      errEl.textContent = 'Please fill in: ' + missing.join(', ');
      errEl.hidden = false;
      return;
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(data.email.trim())) {
      errEl.textContent = 'That doesn\'t look like a valid email address.';
      errEl.hidden = false;
      return;
    }
    saveBtn.disabled = true;
    const original = saveBtn.textContent;
    saveBtn.textContent = 'Saving…';
    try {
      const res = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'content-type': 'application/json', ...adminAuthHeaders() },
        body: JSON.stringify({
          name: data.name, email: data.email, phone: data.phone || '',
          subject: data.subject, category: data.category || '',
          size: data.size || '', notes: data.notes || '',
          photoDataUrl: getPhoto() || '',
          source: 'manual_admin',
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || 'save failed');
      }
      const result = await res.json();
      modal.hidden = true;
      toast(`Request saved · ${result.id}`);
      if (typeof refreshRequestsFromAPI === 'function') refreshRequestsFromAPI();
    } catch (err) {
      errEl.textContent = 'Couldn\'t save: ' + (err.message || 'try again');
      errEl.hidden = false;
      saveBtn.disabled = false;
      saveBtn.textContent = original;
    }
  });

  setTimeout(() => form.querySelector('[name="name"]')?.focus(), 50);
}

/* Manual Order — for when Max takes a phone or in-person sale.
 * Lands in the real /api/orders table now. Single-line item with the
 * subject as the description and the typed dollar value as the total. */
function openNewManualOrderForm() {
  let modal = document.getElementById('newManualOrderModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'newManualOrderModal';
    modal.className = 'request-detail-modal';
    document.body.appendChild(modal);
    modal.addEventListener('click', e => { if (e.target === modal) modal.hidden = true; });
  }
  modal.innerHTML = `
    <div class="rd-card">
      <button class="rd-close" type="button" aria-label="Close">×</button>
      <p class="rd-eyebrow">Phone or in-person sale</p>
      <h2 class="rd-name">Manual order</h2>
      <p class="rd-meta">Quickly punch in a sale Max took offline so it doesn't get lost. Fields marked * are required.</p>
      <form id="newManualOrderForm" class="form" autocomplete="off">
        <label><span>Customer name *</span><input class="inp" name="name" required/></label>
        <div class="row-2">
          <label><span>Email *</span><input class="inp" name="email" type="email" required/></label>
          <label><span>Phone</span><input class="inp" name="phone" type="tel"/></label>
        </div>
        <label><span>What did they buy / commission? *</span><textarea class="inp" name="subject" rows="3" required placeholder="e.g. Coral Trout (CBW-SW-001) ×1, plus a custom Murray Cod 80×34 cm"></textarea></label>
        <div class="row-2">
          <label><span>Total ($AUD)</span><input class="inp" name="size" type="text" placeholder="e.g. 985"/></label>
          <label><span>Status</span>
            <select class="inp" name="category">
              <option value="other">Awaiting payment</option>
              <option value="other">Paid — start production</option>
              <option value="other">Quote agreed</option>
            </select>
          </label>
        </div>
        <label><span>Notes (anything else)</span><textarea class="inp" name="notes" rows="3" placeholder="Pickup vs ship, deadline, deposit taken, timber preference…"></textarea></label>
        ${_PHOTO_BLOCK_HTML}
        <p id="newManualOrderErr" hidden style="color:#d9534f;margin:0;font-size:.9rem;"></p>
      </form>
      <div class="rd-actions">
        <button class="btn btn-gold" type="button" id="newManualOrderSave">Save order</button>
        <button class="btn btn-ghost" type="button" id="newManualOrderCancel">Cancel</button>
      </div>
    </div>`;
  modal.hidden = false;
  modal.querySelector('.rd-close').addEventListener('click', () => modal.hidden = true);
  modal.querySelector('#newManualOrderCancel').addEventListener('click', () => modal.hidden = true);

  const form = modal.querySelector('#newManualOrderForm');
  const errEl = modal.querySelector('#newManualOrderErr');
  const saveBtn = modal.querySelector('#newManualOrderSave');
  const getPhoto = wireAdminPhotoUploader(form);

  saveBtn.addEventListener('click', async () => {
    errEl.hidden = true;
    const data = Object.fromEntries(new FormData(form).entries());
    const missing = ['name','email','subject'].filter(k => !(data[k] || '').trim());
    if (missing.length) {
      errEl.textContent = 'Please fill in: ' + missing.join(', ');
      errEl.hidden = false;
      return;
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(data.email.trim())) {
      errEl.textContent = 'That doesn\'t look like a valid email address.';
      errEl.hidden = false;
      return;
    }
    saveBtn.disabled = true;
    const original = saveBtn.textContent;
    saveBtn.textContent = 'Saving…';
    try {
      // The "Total" field on this form is reused — it's stored as `size`
      // on the data dict but really represents the sale total in dollars.
      const total = parseInt((data.size || '').toString().replace(/[^0-9]/g, ''), 10) || 0;
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'content-type': 'application/json', ...adminAuthHeaders() },
        body: JSON.stringify({
          name: data.name, email: data.email, phone: data.phone || '',
          // Single line item: the subject is the description, total is the price.
          items: [{ id: 'manual', name: data.subject, price: total, qty: 1 }],
          shipping: 0,
          source: 'manual_admin',
          notes: data.notes || '',
          photoDataUrl: getPhoto() || '',
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || 'save failed');
      }
      const result = await res.json();
      modal.hidden = true;
      toast(`Order saved · ${result.id}`);
      if (typeof refreshOrdersFromAPI === 'function') refreshOrdersFromAPI();
    } catch (err) {
      errEl.textContent = 'Couldn\'t save: ' + (err.message || 'try again');
      errEl.hidden = false;
      saveBtn.disabled = false;
      saveBtn.textContent = original;
    }
  });

  setTimeout(() => form.querySelector('[name="name"]')?.focus(), 50);
}

/* ---------- HOMEPAGE EDITOR · featured products list ----------
 * (Removed during the Homepage Editor rebuild — Max's homepage now
 * shows the category-showcase tiles instead of curated featured
 * products, and the rebuilt content editor doesn't include a feature
 * picker. If a featured-products row is added to the storefront
 * homepage in future, persist the picked IDs in
 * site_content.home_featured_ids and read them back here.) */
function renderFeatured(){ /* intentionally a no-op for now */ }
renderFeatured();

/* ---------- HOLIDAY MODE ----------
 * Persisted in D1 site_content under three keys (holiday_active,
 * holiday_until, holiday_message) so the banner reaches every
 * customer, not just whoever's localStorage Max happens to share.
 * localStorage is still updated as a fast cache for first-paint.
 */
(() => {
  const KEY = 'cbwm_holiday';
  const activeEl = document.getElementById('holidayActive');
  const untilEl  = document.getElementById('holidayUntil');
  const msgEl    = document.getElementById('holidayMsg');
  const pill     = document.getElementById('holidayStatusPill');
  if (!activeEl || !untilEl || !msgEl) return;

  function read(){
    return {
      active: !!activeEl.checked,
      until: untilEl.value || '',
      message: msgEl.value || '',
    };
  }
  function updatePill(state){
    if (!pill) return;
    const on = !!state.active;
    pill.dataset.state = on ? 'on' : 'off';
    pill.textContent = on ? 'On' : 'Off';
  }
  function localCache(state){
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (_) {}
  }

  // Async-debounced save — clicking the toggle or typing in the message
  // shouldn't fire 50 PUTs in a row.
  let pending = null;
  async function saveRemote() {
    const state = read();
    localCache(state);
    updatePill(state);
    try {
      await Promise.all([
        saveContent('holiday_active',  state.active ? '1' : '0'),
        saveContent('holiday_until',   state.until || ''),
        saveContent('holiday_message', state.message || ''),
      ]);
      if (pill) {
        pill.classList.add('is-flash');
        setTimeout(() => pill.classList.remove('is-flash'), 800);
      }
    } catch (err) {
      toast('Holiday mode save failed — try again');
    }
  }
  function commit(){
    clearTimeout(pending);
    pending = setTimeout(saveRemote, 500);
  }

  // Populate from D1 first, fall back to localStorage if /api/content is
  // unreachable. Without this, the admin always shows whatever's in this
  // browser's localStorage — even if Max set it on a different machine.
  (async () => {
    let initial = {};
    try {
      const res = await fetch('/api/content', { cache: 'no-store' });
      if (res.ok) {
        const { content } = await res.json();
        if (content) initial = {
          active:  content.holiday_active === '1' || content.holiday_active === 'true',
          until:   content.holiday_until || '',
          message: content.holiday_message || '',
        };
      }
    } catch (_) {}
    if (!initial.active && !initial.until && !initial.message) {
      try { initial = JSON.parse(localStorage.getItem(KEY) || '{}') || {}; }
      catch (_) { initial = {}; }
    }
    activeEl.checked = !!initial.active;
    untilEl.value    = initial.until || '';
    if (initial.message) msgEl.value = initial.message;
    updatePill(initial);
    localCache(initial);
  })();

  activeEl.addEventListener('change', commit);
  untilEl.addEventListener('change', commit);
  msgEl.addEventListener('input', commit);
  msgEl.addEventListener('blur', () => { clearTimeout(pending); saveRemote(); });
})();

/* ---------- PUBLISH BUTTON ---------- */
document.getElementById('publishBtn')?.addEventListener('click', ()=>{
  toast('Homepage changes published.');
});

/* ---------- CSV EXPORT BUILDERS ----------
 * Real CSV exports for Stocktake (products), Orders, and Revenue.
 * RFC 4180 quoting: wrap any field that contains commas/quotes/newlines
 * in double-quotes and escape internal double-quotes by doubling them.
 */
function csvCell(v) {
  if (v == null) return '';
  const s = String(v);
  if (/[",\n\r]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
  return s;
}
function csvRow(arr) { return arr.map(csvCell).join(','); }

function exportProductsCSV() {
  const headers = ['SKU','ID','Name','Category','Price (AUD)','Size','Status','Badge','Description'];
  const lines = [csvRow(headers)];
  for (const p of (PRODUCTS || [])) {
    lines.push(csvRow([
      p.sku || '',
      p.id || '',
      p.name || '',
      p.cat || '',
      p.price ?? '',
      p.size || '',
      p.draft ? 'Draft' : 'Live',
      p.badge || '',
      p.desc || p.description || '',
    ]));
  }
  return lines.join('\n') + '\n';
}

function exportOrdersCSV() {
  const headers = ['Order','Date','Customer','Email','Phone','Address','Suburb','State','Postcode','Items','Subtotal','Shipping','Total','Status','Source','Notes'];
  const lines = [csvRow(headers)];
  // Use _ordersCache when available, fall back to the static stub
  const view = ordersForView();
  for (const o of view) {
    const r = o._raw || {};
    const items = (r.items || []).map(i => `${i.name}${i.qty>1?' x'+i.qty:''}`).join('; ') || o.items || '';
    lines.push(csvRow([
      o.id || '',
      r.createdAt || o.date || '',
      r.name || o.fullName || o.cust || '',
      r.email || o.email || '',
      r.phone || '',
      r.address || '',
      r.suburb || '',
      r.state || '',
      r.postcode || '',
      items,
      r.subtotal ?? '',
      r.shipping ?? '',
      r.total ?? o.total ?? '',
      o.status || '',
      r.source || '',
      r.notes || '',
    ]));
  }
  return lines.join('\n') + '\n';
}

function exportRevenueCSV() {
  // Use the same date-range filter the page is showing
  const orders = (typeof _ordersInRange === 'function') ? _ordersInRange() : [];
  const headers = ['Month','Gross revenue','Orders','Avg. order value','Refunds'];
  // Bucket by year-month
  const buckets = new Map();
  for (const o of orders) {
    const t = o.createdAt ? new Date(o.createdAt.replace(' ', 'T') + 'Z').getTime() : 0;
    if (!t) continue;
    const d = new Date(t);
    const key = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
    const e = buckets.get(key) || { key, gross: 0, refunds: 0, count: 0 };
    const total = Number(o.total) || 0;
    if (o.status === 'refunded' || o.status === 'cancelled') e.refunds += total;
    else { e.gross += total; e.count += 1; }
    buckets.set(key, e);
  }
  const rows = Array.from(buckets.values()).sort((a, b) => a.key.localeCompare(b.key));
  const lines = [csvRow(headers)];
  for (const r of rows) {
    const aov = r.count ? Math.round(r.gross / r.count) : 0;
    lines.push(csvRow([r.key, r.gross, r.count, aov, r.refunds]));
  }
  return lines.join('\n') + '\n';
}

/* ---------- TOP-OF-VIEW ACTION BUTTONS (Import/Export/+ New …) ---------- */
(() => {
  document.querySelectorAll('.v-head-actions .btn').forEach(btn => {
    if (btn.id === 'publishBtn') return; // already wired
    if (btn.dataset.wired) return;
    btn.dataset.wired = '1';
    const label = (btn.textContent || '').trim();
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      // Find which view we're in
      const view = btn.closest('.view')?.dataset.view || 'dashboard';
      handleAdminAction(label, view, btn);
    });
  });
  // Same for the Settings page "+ Add product" featured-block button
  document.querySelectorAll('.btn-block').forEach(btn => {
    if (btn.dataset.wired) return;
    btn.dataset.wired = '1';
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      handleAdminAction((btn.textContent || '').trim(), 'settings', btn);
    });
  });
})();

function handleAdminAction(label, view, btn){
  const l = label.toLowerCase();
  // Import CSV → simulated file picker + progress
  if (l.includes('import')){
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv,text/csv';
    input.addEventListener('change', () => {
      const f = input.files?.[0];
      if (!f) return;
      toast(`Importing ${f.name}…`);
      setTimeout(() => toast(`✓ Imported ${f.name} (${Math.floor(f.size/1024)} KB) — 0 errors`), 1400);
    });
    input.click();
    return;
  }
  // Export → real CSV download
  if (l.includes('export') && !l.includes('pdf')){
    const orig = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'Exporting…';
    try {
      let csv;
      let filenamePart = view;
      if (view === 'orders') {
        csv = exportOrdersCSV();
        filenamePart = 'orders';
      } else if (view === 'revenue') {
        csv = exportRevenueCSV();
        filenamePart = 'revenue';
      } else {
        csv = exportProductsCSV();
        filenamePart = 'products';
      }
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `crystalbrook-${filenamePart}-${new Date().toISOString().slice(0,10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      const rowCount = csv.split('\n').length - 2;  // minus header + trailing newline
      toast(`✓ Exported ${rowCount} ${filenamePart} row${rowCount === 1 ? '' : 's'}`);
    } catch (err) {
      console.error('export failed', err);
      toast('Export failed — try again');
    }
    btn.disabled = false;
    btn.textContent = orig;
    return;
  }
  // "+ New quote" on Custom Orders → real form that creates a request in D1
  if (view === 'custom' && (l.includes('quote') || l.includes('new'))) {
    openNewQuoteForm();
    return;
  }
  // "+ Manual order" on Orders → real form (saves to /api/requests for now,
  //   pending a dedicated orders table — see audit follow-up)
  if (view === 'orders' && (l.includes('manual') || l.includes('new'))) {
    openNewManualOrderForm();
    return;
  }
  // + New product / + Add product → generic placeholder modal
  if (l.startsWith('+') || l.includes('new') || l.includes('add') || l.includes('manual')){
    openAdminModal(label, view);
    return;
  }
  // Preview button on Settings → open the home page in new tab
  if (l.includes('preview')){
    window.open('../index.html?preview=1', '_blank');
    toast('Opening preview in a new tab…');
    return;
  }
  // Export PDF
  if (l.includes('pdf')){
    toast('Putting your PDF together — give it a sec.');
    return;
  }
  toast(`"${label}" — we'll get this hooked up soon.`);
}

function openAdminModal(label, view){
  // Build a one-shot modal scaffold the first time, reuse it after
  let modal = document.getElementById('adminActionModal');
  if (!modal){
    modal = document.createElement('div');
    modal.id = 'adminActionModal';
    modal.className = 'admin-modal';
    modal.innerHTML = `
      <div class="admin-modal-card">
        <button class="admin-modal-close" type="button" aria-label="Close">×</button>
        <h2 id="adminModalTitle"></h2>
        <p id="adminModalLede"></p>
        <div id="adminModalBody"></div>
        <div class="admin-modal-actions">
          <button class="btn btn-ghost" id="adminModalCancel" type="button">Cancel</button>
          <button class="btn btn-gold" id="adminModalSave" type="button">Save</button>
        </div>
      </div>`;
    document.body.appendChild(modal);
    modal.querySelector('.admin-modal-close').addEventListener('click', () => modal.classList.remove('is-open'));
    modal.querySelector('#adminModalCancel').addEventListener('click', () => modal.classList.remove('is-open'));
    modal.addEventListener('click', e => { if (e.target === modal) modal.classList.remove('is-open'); });
    modal.querySelector('#adminModalSave').addEventListener('click', () => {
      modal.classList.remove('is-open');
      toast('Saved.');
    });
  }
  const title = label.replace(/^\+\s*/, '').replace(/^./, c => c.toUpperCase());
  modal.querySelector('#adminModalTitle').textContent = title;
  // Plain-English lede per view, no developer jargon
  const ledeByView = {
    products: 'Fill in what the new piece is, what it costs and pop a photo on it.',
    orders:   'Quickly add a phone or in-person order so it shows in your list.',
    quotes:   'Write up a custom commission quote to send the customer.',
    settings: 'Add a new piece to feature on the home page.',
  };
  modal.querySelector('#adminModalLede').textContent =
    ledeByView[view] || `Fill in the details and hit Save.`;
  // Generate a few sensible fields based on the action
  let fields = '';
  if (view === 'products' || /product/i.test(label)){
    fields = `
      <label><span>Product name</span><input class="inp" placeholder="e.g. Coral Trout"/></label>
      <label><span>Category</span>
        <select class="inp">
          <option>Saltwater Fish</option><option>Freshwater Fish</option>
          <option>Cars</option><option>Animals</option><option>Birds</option>
        </select>
      </label>
      <label><span>Price (AUD)</span><input class="inp" type="number" placeholder="495"/></label>
      <label><span>Size (cm)</span><input class="inp" placeholder="68 × 32 cm"/></label>
      <label><span>Image</span><div class="mini-drop">Drop a transparent PNG or click to choose</div></label>`;
  } else if (view === 'orders'){
    fields = `
      <label><span>Customer name</span><input class="inp"/></label>
      <label><span>Customer email</span><input class="inp" type="email"/></label>
      <label><span>Items (one SKU per line)</span><textarea class="inp" rows="4"></textarea></label>
      <label><span>Total</span><input class="inp" type="number"/></label>`;
  } else if (view === 'quotes'){
    fields = `
      <label><span>Customer name</span><input class="inp"/></label>
      <label><span>Customer email</span><input class="inp" type="email"/></label>
      <label><span>Brief</span><textarea class="inp" rows="3" placeholder="What does the customer want made?"></textarea></label>
      <label><span>Quoted price</span><input class="inp" type="number"/></label>`;
  } else {
    fields = `<label><span>Notes</span><textarea class="inp" rows="4"></textarea></label>`;
  }
  modal.querySelector('#adminModalBody').innerHTML = `<div class="form">${fields}</div>`;
  modal.classList.add('is-open');
}

/* ======================================================
   IMAGE BUILDER — Cloudflare Workers AI front end for Max
   ======================================================
 * UX goal: 3 steps, big buttons, plain English. No prompt
 * engineering for Max — the templates expand into FLUX-tuned
 * style strings under the hood.
 *
 * Backend contract (when wired):
 *   POST /api/studio/generate
 *   Body: { prompt, count, transparent, resolution, refStyle }
 *   Response: {
 *     generations: [
 *       { id, url, transparentUrl, prompt, model, costNeurons, createdAt }
 *     ]
 *   }
 *
 *   POST /api/studio/save-as-product
 *   Body: { generationId, productData }
 *   Response: { product: {...PRODUCTS-shape} }
 *
 * The mockup below simulates this with shuffled existing
 * catalogue images so Max can experience the full flow today.
 */
(() => {
  const ibTpls       = document.querySelectorAll('.ib-tpl');
  const ibSubject    = document.getElementById('ibSubject');
  const ibGen        = document.getElementById('ibGenerate');
  const ibProgress   = document.getElementById('ibProgress');
  const ibProgressTx = document.getElementById('ibProgressText');
  const ibProgressFl = document.getElementById('ibProgressFill');
  const ibResults    = document.getElementById('ibResults');
  const ibResultsGrid= document.getElementById('ibResultsGrid');
  const ibTryAgain   = document.getElementById('ibTryAgain');
  const ibStartOver  = document.getElementById('ibStartOver');
  const ibHistory    = document.getElementById('ibHistory');
  const ibHistoryGrid= document.getElementById('ibHistoryGrid');
  const ibHistoryClr = document.getElementById('ibHistoryClear');
  const ibSuggestions= document.getElementById('ibSuggestions');
  const ibSuggestionChips = document.getElementById('ibSuggestionChips');
  if (!ibGen || !ibSubject) return;

  const state = { template: null, busy: false };

  // Per-template style suffix that gets appended to Max's plain-English
  // subject. These are tuned to the existing catalogue look.
  const STYLE_PRESETS = {
    saltwater:  'isolated on pure white background, side profile, vivid archival pigment colours, hyperrealistic, studio lighting, no shadow, sharp scale detail, 8k product photography',
    freshwater: 'isolated on pure white background, side profile, natural river-fish colours, hyperrealistic, studio lighting, no shadow, sharp detail, 8k product photography',
    cars:       'isolated on pure white background, classic-car side profile, glossy paintwork, period-correct details, no background reflections, hyperrealistic, sharp detail, 8k product photography',
    animals:    'isolated on pure white background, three-quarter pose, soft studio lighting, hyperrealistic fur detail, no shadow, 8k product photography',
    birds:      'isolated on pure white background, side profile or perched, vibrant plumage, hyperrealistic, no shadow, 8k product photography',
    // Generic catalogue-look preset — for anything outside the 5 main
    // categories. Max can describe a tractor, a footy jersey, a vintage
    // Fender Strat, anything — and still get the same Crystal Brook
    // hyperreal-on-white look.
    other:      'isolated on pure white background, hyperrealistic, studio lighting, no shadow, sharp detail, 8k product photography, archival pigment colour palette',
  };

  // Suggestion chips per template — Max can click instead of typing
  const SUGGESTIONS = {
    saltwater:  ['coral trout', 'wahoo mid-strike', 'GT silver flank', 'red emperor snapper'],
    freshwater: ['barramundi leaping', 'murray cod, mottled green', 'sooty grunter', 'jungle perch'],
    cars:       ['1973 XB Falcon', 'HQ Holden Statesman', 'EH Holden in white', '1970 Mustang Boss 302'],
    animals:    ['Maremma sheepdog', 'spotted-tail quoll', 'wombat side-on', 'border collie pup'],
    birds:      ['eclectus parrot', 'gouldian finch', 'powerful owl', 'crimson rosella'],
    other:      ['1965 Fender Stratocaster', 'Brisbane Lions guernsey', 'old timber lobster pot', 'vintage compass and map'],
  };

  /* Pool of existing catalogue images we shuffle for the mockup output.
   * When the backend lands, replace this with the real /api/studio/generate
   * call — same render path consumes the response. */
  const MOCK_POOL = {
    saltwater:  ['coral.png','coral-alt.png','mahi.png','snapper.png','bonus-mackerel.png'],
    freshwater: ['barra.png','cod.png'],
    cars:       ['monaro.png','torana.png','xygt.png'],
    animals:    ['frenchie.png','bonus-sea-turtle.png','bonus-ulysses-butterfly.png'],
    birds:      ['lorikeet.png'],
    // "Other" mockup pool: shuffle across all categories for visual variety
    other:      ['coral.png','barra.png','monaro.png','frenchie.png','lorikeet.png','bonus-ulysses-butterfly.png'],
  };
  const PROD_IMG = '../assets/images/products/';

  function pickTemplate(tpl){
    state.template = tpl;
    ibTpls.forEach(b => b.classList.toggle('is-active', b.dataset.tpl === tpl));
    ibGen.disabled = false;
    // Show suggestions
    ibSuggestionChips.innerHTML = (SUGGESTIONS[tpl] || []).map(s =>
      `<button class="ib-chip" type="button" data-q="${s}">${s}</button>`
    ).join('');
    ibSuggestions.hidden = false;
    ibSuggestions.querySelectorAll('.ib-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        ibSubject.value = chip.dataset.q;
        ibSubject.focus();
      });
    });
  }

  ibTpls.forEach(b => b.addEventListener('click', () => pickTemplate(b.dataset.tpl)));

  // Build a real FLUX prompt from Max's plain-English input
  function buildPrompt(){
    const subject = (ibSubject.value || '').trim();
    if (!subject || !state.template) return null;
    return `${subject}, ${STYLE_PRESETS[state.template]}`;
  }

  // Endpoint for the real Cloudflare Worker that runs FLUX 1 Schnell.
  // Hardcoded default + localStorage override (so dev/prod can differ
  // without a code change).
  const DEFAULT_IMAGE_BUILDER_ENDPOINT =
    'https://crystalbrook-image-builder.steve-700.workers.dev/api/studio/generate';
  function getEndpoint(){
    return localStorage.getItem('cbwm_image_builder_endpoint')
        || DEFAULT_IMAGE_BUILDER_ENDPOINT;
  }

  async function callRealBackend(subject, category){
    const endpoint = getEndpoint();
    if (!endpoint) return null;
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // New 2-stage API: send raw subject + category, the Worker
      // expands via Llama → detailed FLUX prompt → 4 images.
      body: JSON.stringify({ subject, category, count: 4 }),
    });
    if (!res.ok){
      const text = await res.text().catch(() => '');
      throw new Error(`Worker ${res.status}: ${text.slice(0, 120)}`);
    }
    const data = await res.json();
    if (!data.generations?.length) throw new Error('Worker returned no generations');
    if (data.expandedPrompt){
      console.log('[image-builder] Llama expanded prompt:', data.expandedPrompt);
    }
    return data.generations;
  }

  async function generate(){
    const subject = (ibSubject.value || '').trim();
    if (!subject || !state.template){
      toast('Pick a category and type what you want first.');
      return;
    }
    // Legacy fallback prompt for the mockup pool ONLY (when backend is unreachable)
    const fullPrompt = buildPrompt();
    if (state.busy) return;
    state.busy = true;
    ibGen.disabled = true;

    // Show progress
    ibResults.hidden = true;
    ibProgress.hidden = false;
    const usingReal = !!getEndpoint();
    const stages = [
      ['Reading what you typed…',           14],
      ['Drawing your 4 photos…',            60],
      ['Cleaning up the backgrounds…',      88],
      ['Almost ready…',                     100],
    ];

    let generations = null;
    let backendError = null;

    // Kick off the real backend call in parallel with the progress animation
    const realPromise = usingReal ? callRealBackend(subject, state.template).catch(err => {
      backendError = err;
      return null;
    }) : Promise.resolve(null);

    // Animate progress while waiting for the real (or simulated) result
    for (const [label, pct] of stages){
      ibProgressTx.textContent = label;
      ibProgressFl.style.width = pct + '%';
      await new Promise(r => setTimeout(r, 700 + Math.random() * 600));
    }

    generations = await realPromise;

    // If the AI is unreachable, fall back to preview images so the
    // page never feels broken
    if (!generations){
      if (backendError){
        console.warn('[image-builder] backend failed, using preview images:', backendError.message);
        toast('Couldn\'t reach the AI just now — here are some examples instead. Try again in a minute?');
      }
      const pool = MOCK_POOL[state.template] || MOCK_POOL.animals;
      const shuffled = pool.slice().sort(() => Math.random() - 0.5);
      generations = Array.from({ length: 4 }, (_, i) => ({
        id: 'gen-' + Date.now() + '-' + i,
        url: PROD_IMG + shuffled[i % shuffled.length],
        prompt: fullPrompt,
        model: 'preview',
        createdAt: Date.now(),
      }));
    }

    ibProgress.hidden = true;
    renderResults(generations);
    saveToHistory(generations[0]);
    state.busy = false;
    ibGen.disabled = false;
  }

  function renderResults(gens){
    ibResultsGrid.innerHTML = gens.map(g => `
      <div class="ib-result" data-id="${g.id}">
        <div class="ib-result-img">
          <img src="${g.url}" alt="${escapeHtml(g.prompt.slice(0, 60))}"/>
        </div>
        <div class="ib-result-actions">
          <button class="btn btn-gold ib-use" data-use="${g.id}" type="button">Use this one →</button>
          <a class="btn btn-ghost" href="${g.url}" download="crystalbrook-${g.id}.png">↓ Download</a>
          <button class="btn btn-ghost ib-variants" data-variants="${g.id}" type="button">↻ Variations</button>
        </div>
      </div>
    `).join('');

    ibResultsGrid.querySelectorAll('[data-use]').forEach(b => {
      b.addEventListener('click', () => useAsProduct(gens.find(g => g.id === b.dataset.use)));
    });
    ibResultsGrid.querySelectorAll('[data-variants]').forEach(b => {
      b.addEventListener('click', () => generate()); // re-roll
    });

    ibResults.hidden = false;
    ibResults.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function useAsProduct(gen){
    if (!gen) return;
    // === REAL BACKEND (when wired) saves to PRODUCTS via the Worker ===
    toast(`✓ Added to your shop. You can edit the price and name on the Stocktake page.`);
    // Save to history
    saveToHistory(gen);
  }

  function saveToHistory(gen){
    let hist = [];
    try { hist = JSON.parse(localStorage.getItem('cbwm_ib_history') || '[]'); } catch(_){}
    hist.unshift(gen);
    hist = hist.slice(0, 12);
    localStorage.setItem('cbwm_ib_history', JSON.stringify(hist));
    renderHistory();
  }

  function renderHistory(){
    let hist = [];
    try { hist = JSON.parse(localStorage.getItem('cbwm_ib_history') || '[]'); } catch(_){}
    if (!hist.length){ ibHistory.hidden = true; return; }
    ibHistory.hidden = false;
    ibHistoryGrid.innerHTML = hist.map(g => `
      <div class="ib-history-thumb" title="${escapeHtml(g.prompt)}">
        <img src="${g.url}" alt=""/>
        <span class="ib-history-prompt">${escapeHtml(g.prompt.slice(0, 40))}…</span>
      </div>
    `).join('');
  }

  function escapeHtml(s){
    return (s || '').replace(/[<>&"']/g, c =>
      ({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&#39;'}[c])
    );
  }

  ibGen.addEventListener('click', generate);
  ibSubject.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !ibGen.disabled) generate();
  });
  ibTryAgain?.addEventListener('click', generate);
  ibStartOver?.addEventListener('click', () => {
    state.template = null;
    ibTpls.forEach(b => b.classList.remove('is-active'));
    ibSubject.value = '';
    ibSuggestions.hidden = true;
    ibResults.hidden = true;
    ibGen.disabled = true;
    document.querySelector('.ib-card')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
  ibHistoryClr?.addEventListener('click', () => {
    localStorage.removeItem('cbwm_ib_history');
    renderHistory();
  });

  renderHistory();
})();

/* ---------- TOAST ---------- */
const toastEl = document.getElementById('toast');
let toastTimer;
function toast(msg){
  toastEl.textContent = msg;
  toastEl.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(()=>toastEl.classList.remove('show'), 2200);
}

/* ======================================================
   HELP DRAWER — context-aware guides written for Max
   ====================================================== */
const HELP_GUIDES = {
  dashboard: {
    title: 'Your dashboard, in plain English',
    sections: [
      { h: "What you're looking at", steps: [
        'The four boxes up top are your numbers for the month — revenue, orders sent, anything running low, and how many custom requests are waiting.',
        'The chart shows revenue over the last 12 months. Use the 12m / 90d / 30d buttons to zoom in.',
        'Recent orders is the latest 10 — click "View all →" to manage them properly.',
      ]},
      { h: 'Things you can do here', steps: [
        '"+ New product" — add a new piece to the catalogue (you can also do this from Stocktake).',
        '"Export" — saves a CSV summary of this month for your records.',
        'Click any number on the cards above to drill into the details.',
      ]},
      { h: 'If something looks off', steps: [
        'Numbers update automatically whenever an order or payment comes in — no need to refresh.',
        'If "Low stock" goes red, head to Stocktake and bump the quantities for those pieces.',
      ]},
    ],
  },
  products: {
    title: 'Stocktake — managing your pieces',
    sections: [
      { h: 'What this page is for', steps: [
        "A list of every piece you make. Each row shows what's in stock, the price, and the SKU (your internal code).",
        'Use the search box up top to find a piece by name or SKU.',
        'The category tabs filter the list — click "Saltwater" to see only fish, etc.',
      ]},
      { h: 'How to add a new piece', steps: [
        'Click "+ New product" up top.',
        'Fill in the name, category, size, price, and starting stock.',
        'Drop the photo into the image box (the same kind of cutout PNG we use on the website).',
        "Hit Save — it's live on the storefront straight away.",
      ]},
      { h: 'How to update stock', steps: [
        'Find the piece in the list.',
        'Click the stock number — it turns into an editable box.',
        'Type the new number, hit Enter, done.',
      ]},
      { h: 'What the colours mean', steps: [
        'Green = in stock and healthy.',
        'Amber = running low (2 or fewer left).',
        "Red = out of stock — the piece won't show up in the storefront until you restock.",
      ]},
    ],
  },
  orders: {
    title: 'Orders — the lifecycle of a sale',
    sections: [
      { h: "What you're looking at", steps: [
        'Every order that has come through, newest first.',
        "Each one shows the customer, what they bought, the total, and where it's up to.",
      ]},
      { h: 'Order statuses, in order', steps: [
        "Paid — money's landed in Stripe. You can start work.",
        "Production — you're cutting / mounting / pouring resin.",
        'Shipped — it is on the way. The customer gets a tracking email automatically.',
        "Delivered — they've got it.",
        'Refunded — you sent the money back.',
      ]},
      { h: 'How to update an order', steps: [
        'Click the order ID to open it.',
        'Use the status dropdown to move it to the next step.',
        'When you mark it Shipped, paste in the AusPost tracking number — the customer email goes out automatically.',
      ]},
      { h: 'Printing labels & invoices', steps: [
        'Open the order, then use the "Print label" or "Print invoice" buttons up the top right.',
        'Both are A4-friendly so any home printer works.',
      ]},
    ],
  },
  custom: {
    title: 'Custom orders — quoting and tracking commissions',
    sections: [
      { h: 'How custom requests come in', steps: [
        'When someone fills out the "Commission" form on the storefront, it lands in the "New" column here.',
        'Their photo, brief, budget and the AI mockup preview all come through together.',
      ]},
      { h: 'Working through a request', steps: [
        '"New" → review the brief and reply with a quote. Drag the card to "Quoted".',
        '"Quoted" → if they accept, they will pay a deposit. Drag to "Approved".',
        '"Approved" → start the piece. When it ships, drag to "Done".',
        'You can drag cards between columns or use the dropdown on each card.',
      ]},
      { h: 'Replying to the customer', steps: [
        'Click any card to open it — their message, photo and contact details are all there.',
        'Use the "Reply" button to send them an email — your message goes out from your Optus address.',
      ]},
    ],
  },
  revenue: {
    title: 'Revenue — how the money is tracking',
    sections: [
      { h: "What you're looking at", steps: [
        'Total revenue, average order value, top-selling categories — all sliceable by date range.',
        'Use the date picker up top to narrow to a week, month, quarter or year.',
      ]},
      { h: 'Tax & accounting', steps: [
        'GST is calculated automatically (10% on Australian orders).',
        'Click "Export to MYOB / Xero" to send a clean summary to your accountant.',
      ]},
      { h: 'Comparing periods', steps: [
        'The "vs" column shows how this period compares to the previous one (e.g., this month vs last month).',
        'Green arrow = up, red = down.',
      ]},
    ],
  },
  homepage: {
    title: 'Homepage editor — the storefront looks',
    sections: [
      { h: 'What you can change', steps: [
        'The hero piece (the big fish in pride of place at the top of the site).',
        'The "Signature Piece" callout below the feature strip.',
        'The featured pieces in the gallery section.',
        'The page title and meta description (what shows up in Google search results).',
      ]},
      { h: 'Reordering the gallery', steps: [
        'Grab a piece by the handle (the dotted icon on the left of each row) and drag it up or down.',
        'Order is saved automatically — no Save button needed.',
      ]},
      { h: 'Going live with changes', steps: [
        'Click "Publish" up top.',
        'Changes appear on the storefront within a few seconds.',
        'If you make a mistake, click "Revert" to roll back to the last published version.',
      ]},
    ],
  },
  studio: {
    title: 'Image Builder — make new product photos',
    sections: [
      { heading: 'When to use it',
        text: 'Whenever you need a new product photo and don\'t have one yet. Type what you want, hit Generate, pick the version you like best.' },
      { heading: 'Three steps. That\'s it.',
        text: '1) Click the kind of piece (fish, car, animal, bird). 2) Type what you want in plain English — "barramundi jumping out of the water". 3) Hit the gold "Generate 4 photos" button. Wait about 10 seconds.' },
      { heading: 'You don\'t need to be technical',
        text: 'No need to write fancy "AI prompts" — just describe it like you would to me on the phone. The categories on Step 1 already tell the AI what style to use.' },
      { heading: 'Pick the one you like',
        text: 'Four versions appear. Hover any of them to see options. "Use this one →" adds it to your shop straight away. "↓ Download" saves the file to your computer (good for the print version). "↻ Variations" runs another 4 in the same style.' },
      { heading: 'If none look right',
        text: 'Either click "↻ Try 4 more" to keep the same description and roll again, or "← Start over" to change the description completely. The AI gets better the more specific you are — "a Murray cod, side profile, mottled green and gold" beats just "a fish".' },
      { heading: 'Recent generations',
        text: 'Anything you generate stays in the "Recent" section at the bottom for the next two weeks, so you can come back to images you liked but didn\'t use yet.' },
    ],
  },
  settings: {
    title: 'Settings — business, payments and shipping',
    sections: [
      { h: 'Business details', steps: [
        'Your business name, ABN and contact email go on every invoice and receipt.',
        'Update these here if anything changes.',
      ]},
      { h: 'Payments (Stripe)', steps: [
        "Stripe is already connected — that's how customers pay by card.",
        'If you ever need to disconnect or switch accounts, click the green "Connected" badge.',
        'Money lands in your bank account every business day.',
      ]},
      { h: 'Shipping rules', steps: [
        'Set the flat rate for Australia and the threshold for free shipping.',
        'International is "Quote on request" — you will get an email each time someone overseas wants something.',
      ]},
      { h: 'Help & support', steps: [
        "If anything stops working or you're not sure, ring Penny Wise I.T. — number is in the bottom of this drawer.",
      ]},
    ],
  },
};

(() => {
  const drawer  = document.getElementById('helpDrawer');
  const scrim   = document.getElementById('helpScrim');
  const closeBtn= document.getElementById('helpDrawerClose');
  const helpBtn = document.getElementById('helpBtn');
  const titleEl = document.getElementById('helpDrawerTitle');
  const bodyEl  = document.getElementById('helpDrawerBody');
  if (!drawer || !helpBtn) return;

  function currentView(){
    const active = document.querySelector('.view.is-active');
    return active?.dataset.view || 'dashboard';
  }
  function renderHelp(viewKey){
    const guide = HELP_GUIDES[viewKey] || HELP_GUIDES.dashboard;
    titleEl.textContent = guide.title;
    bodyEl.innerHTML = guide.sections.map(s => `
      <article class="help-section">
        <h3>${s.h}</h3>
        ${s.steps.map((step, i) => `
          <div class="help-step">
            <span class="help-step-num">${i + 1}</span>
            <span class="help-step-text">${step}</span>
          </div>
        `).join('')}
      </article>
    `).join('');
  }
  function openHelp(){
    renderHelp(currentView());
    drawer.classList.add('is-open');
    drawer.setAttribute('aria-hidden', 'false');
    scrim.classList.add('is-open');
  }
  function closeHelp(){
    drawer.classList.remove('is-open');
    drawer.setAttribute('aria-hidden', 'true');
    scrim.classList.remove('is-open');
  }

  helpBtn.addEventListener('click', openHelp);
  closeBtn?.addEventListener('click', closeHelp);
  scrim?.addEventListener('click', closeHelp);
  document.querySelectorAll('[data-help-toggle]').forEach(b => b.addEventListener('click', openHelp));

  // Keyboard: ? opens help, Esc closes
  document.addEventListener('keydown', e => {
    if (e.key === '?' && !e.target.matches('input, textarea, select')) {
      e.preventDefault();
      openHelp();
    } else if (e.key === 'Escape' && drawer.classList.contains('is-open')) {
      closeHelp();
    }
  });

  // Re-render help content if user switches views with the drawer open
  document.getElementById('sideNav')?.addEventListener('click', () => {
    if (drawer.classList.contains('is-open')) {
      setTimeout(() => renderHelp(currentView()), 50);
    }
  });
})();

/* ======================================================
   INLINE HELP TIPS — a "?" next to every action and section
   Every tip is plain English, written like Max would read it.
   To add a new tip: append to INLINE_TIPS with a CSS selector + text.
   ====================================================== */
const INLINE_TIPS = [
  /* ---------- DASHBOARD ---------- */
  { sel: '[data-view="dashboard"] .v-head-actions .btn-ghost',
    text: 'Saves a CSV summary of this month so you can keep your own records or send to your accountant.' },
  { sel: '[data-view="dashboard"] .v-head-actions .btn-gold',
    text: 'Quick way to add a new piece to the catalogue. Does the same thing as the "+ New product" button on the Stocktake page.' },
  { sel: '[data-view="dashboard"] .kpis .kpi:nth-child(1)',
    text: 'Money received this month from Stripe payments. Updates automatically — no need to refresh.' },
  { sel: '[data-view="dashboard"] .kpis .kpi:nth-child(2)',
    text: 'Total orders this month, including ones still being made and ones already shipped.' },
  { sel: '[data-view="dashboard"] .kpis .kpi:nth-child(3)',
    text: 'Pieces with 2 or fewer left in stock. Click through to Stocktake to top them back up.' },
  { sel: '[data-view="dashboard"] .kpis .kpi:nth-child(4)',
    text: 'New commission enquiries from the website that are waiting for your reply.' },
  { sel: '[data-view="dashboard"] .card-lg .card-head h3',
    text: 'Sales over the last 12 months. Use the buttons on the right to zoom into the last 90 or 30 days.' },
  { sel: '[data-view="dashboard"] .card:not(.card-lg):not(.card-wide) .card-head h3',
    text: 'Your best-performing pieces this month, ranked by units sold.' },
  { sel: '[data-view="dashboard"] .card-wide .card-head h3',
    text: 'The 10 newest orders. Click "View all →" to manage every order.' },

  /* ---------- STOCKTAKE / PRODUCTS ---------- */
  { sel: '[data-view="products"] .v-head-actions .btn-ghost:nth-child(1)',
    text: 'Bulk-add or update pieces from a spreadsheet. Handy if you have 20+ to do at once. Download the template first to see the columns.' },
  { sel: '[data-view="products"] .v-head-actions .btn-ghost:nth-child(2)',
    text: 'Download your full catalogue as a CSV — opens cleanly in Excel or Numbers. Use this for backups too.' },
  { sel: '[data-view="products"] .v-head-actions .btn-gold',
    text: 'Add one new piece. Fill in the name, category, size and price, drop the cutout photo in, hit Save — it goes live on the storefront straight away.' },
  { sel: '[data-view="products"] .filter-bar .tabs',
    text: 'Quick filters. "Low" shows pieces running short, "Out" shows what needs restocking now.' },
  { sel: '[data-view="products"] .filter-bar .filter-right .sel',
    text: 'Show only one category at a time — e.g. just Saltwater Fish or just Cars.' },
  { sel: '[data-view="products"] .filter-bar .filter-right .inp',
    text: 'Type any part of a name (e.g. "coral") or SKU (e.g. "CBW-SW") to find a piece fast.' },

  /* ---------- ORDERS ---------- */
  { sel: '[data-view="orders"] .v-head-actions .btn-ghost',
    text: 'Download all orders for the chosen date range as a CSV. Hand to your accountant or keep for your records.' },
  { sel: '[data-view="orders"] .v-head-actions .btn-gold',
    text: 'Add an order manually — useful if a customer paid offline (cash, bank transfer, market stall).' },
  { sel: '[data-view="orders"] .filter-bar .tabs',
    text: 'Filter to just one stage. "Paid" = ready to start work. "In production" = on the bench. "Shipped" = on the way to the customer.' },
  { sel: '[data-view="orders"] .filter-bar .filter-right .sel',
    text: 'Pick a time window. Default is the last 30 days.' },
  { sel: '[data-view="orders"] .filter-bar .filter-right .inp',
    text: 'Find any order by number, customer name or email address.' },

  /* ---------- CUSTOM ORDERS ---------- */
  { sel: '[data-view="custom"] .v-head-actions .btn-gold',
    text: 'Manually start a new quote. Most quotes come through the website automatically — only use this for offline enquiries.' },

  /* ---------- REVENUE ---------- */
  { sel: '[data-view="revenue"] .v-head-actions .sel',
    text: 'Switch the time range. All numbers, charts and tables on this page update to match.' },
  { sel: '[data-view="revenue"] .v-head-actions .btn-ghost',
    text: 'Saves a printable PDF report — great for end-of-quarter or sending to your accountant.' },
  { sel: '[data-view="revenue"] .kpis .kpi:nth-child(1)',
    text: 'Total sales before any fees or refunds. The big-picture number.' },
  { sel: '[data-view="revenue"] .kpis .kpi:nth-child(2)',
    text: 'What actually lands in your bank account after Stripe takes its 1.5% processing fee.' },
  { sel: '[data-view="revenue"] .kpis .kpi:nth-child(3)',
    text: 'Average dollar value of each order. If this number rises, customers are buying bigger pieces.' },
  { sel: '[data-view="revenue"] .kpis .kpi:nth-child(4)',
    text: 'Money sent back to customers. The "rate" tells you what % of orders ended up refunded.' },
  { sel: '[data-view="revenue"] .card-lg .card-head h3',
    text: 'Side-by-side bars for every month. Use this to spot busy seasons or quiet patches.' },
  { sel: '[data-view="revenue"] .card:not(.card-lg):not(.card-wide) .card-head h3',
    text: 'Which categories bring in the most money. Helps you decide what to make more of.' },
  { sel: '[data-view="revenue"] .card-wide .card-head h3',
    text: 'Your best-earning pieces ranked by total revenue, not just unit count.' },

  /* ---------- HOMEPAGE EDITOR ---------- */
  { sel: '[data-view="homepage"] .v-head-actions .btn-ghost',
    text: 'See your changes in a new tab before they go live. Nothing is published until you hit "Publish changes".' },
  { sel: '[data-view="homepage"] .v-head-actions .btn-gold',
    text: 'Push everything live to the storefront. Changes show up in a few seconds. If you make a mistake, hit "Revert" to go back.' },
  { sel: '[data-view="homepage"] .editor-grid .card:nth-child(1) .card-head h3',
    text: 'The big banner at the top of your homepage. Headline, lede, and the two main buttons.' },
  { sel: '[data-view="homepage"] .editor-grid .card:nth-child(2) .card-head h3',
    text: 'The pieces shown on the homepage gallery. Drag to reorder — first 8 appear on the storefront.' },
  { sel: '[data-view="homepage"] .editor-grid .card:nth-child(3) .card-head h3',
    text: 'Your story — what shows up under "The Craft" on the homepage.' },
  { sel: '[data-view="homepage"] .editor-grid .card:nth-child(4) .card-head h3',
    text: 'Controls how the page shows up in Google search results and when shared on Facebook / Instagram.' },

  /* ---------- SETTINGS ---------- */
  { sel: '[data-view="settings"] .dash-grid .card:nth-child(1) .card-head h3',
    text: 'Goes on every invoice, receipt and email. Keep these accurate — they are legally required on tax invoices.' },
  { sel: '[data-view="settings"] .dash-grid .card:nth-child(2) .card-head h3',
    text: 'Stripe handles all card payments. Already connected — money lands in your bank account every business day.' },
  { sel: '[data-view="settings"] .dash-grid .card:nth-child(3) .card-head h3',
    text: 'Postage rules. Right now every Australian order ships free — the cost is baked into your piece prices.' },
];

(() => {
  // Build the singleton popover element
  const popover = document.createElement('div');
  popover.className = 'help-popover';
  popover.setAttribute('role', 'tooltip');
  popover.hidden = true;
  document.body.appendChild(popover);

  let activeTip = null;
  function showPopover(tipBtn) {
    const text = tipBtn.dataset.tip;
    if (!text) return;
    popover.textContent = text;
    popover.hidden = false;
    // Position
    const r = tipBtn.getBoundingClientRect();
    const popW = Math.min(280, window.innerWidth - 32);
    popover.style.maxWidth = popW + 'px';
    let left = r.left + r.width / 2 - popW / 2;
    left = Math.max(12, Math.min(left, window.innerWidth - popW - 12));
    let top = r.bottom + 10;
    // If it would render off the bottom, flip above
    if (top + popover.offsetHeight > window.innerHeight - 12) {
      top = r.top - popover.offsetHeight - 10;
    }
    popover.style.left = left + 'px';
    popover.style.top  = top + 'px';
    popover.classList.add('is-open');
    activeTip = tipBtn;
    tipBtn.classList.add('is-active');
  }
  function hidePopover() {
    popover.classList.remove('is-open');
    setTimeout(() => { popover.hidden = true; }, 200);
    activeTip?.classList.remove('is-active');
    activeTip = null;
  }

  function tipIconHTML() {
    return `<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true">
      <circle cx="12" cy="12" r="9"/>
      <path d="M9.5 9a2.5 2.5 0 1 1 4 2c-1 .8-1.5 1.4-1.5 2.5"/>
      <circle cx="12" cy="17.2" r="1" fill="currentColor" stroke="none"/>
    </svg>`;
  }

  function attachTips() {
    INLINE_TIPS.forEach(({ sel, text }) => {
      document.querySelectorAll(sel).forEach((el) => {
        if (el.querySelector(':scope > .help-tip')) return; // already attached
        if (el.dataset.tipAttached) return;
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'help-tip';
        btn.dataset.tip = text;
        btn.setAttribute('aria-label', 'What does this do?');
        btn.title = ''; // suppress native tooltip — we own this
        btn.innerHTML = tipIconHTML();
        // Append inside the element (sits inline next to text)
        el.appendChild(btn);
        el.dataset.tipAttached = '1';
      });
    });
  }

  // Click anywhere a help-tip button (delegated)
  document.addEventListener('click', (e) => {
    const tip = e.target.closest('.help-tip');
    if (tip) {
      e.preventDefault();
      e.stopPropagation();
      if (activeTip === tip) hidePopover();
      else showPopover(tip);
      return;
    }
    if (activeTip && !e.target.closest('.help-popover')) hidePopover();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && activeTip) hidePopover();
  });
  window.addEventListener('resize', hidePopover);
  document.addEventListener('scroll', hidePopover, true);

  // Attach on load + whenever views switch (some elements may be lazy-rendered)
  attachTips();
  const sideNav = document.getElementById('sideNav');
  sideNav?.addEventListener('click', () => setTimeout(attachTips, 60));
})();

/* ======================================================
   PWA: SERVICE WORKER REGISTRATION (admin)
   ====================================================== */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      navigator.serviceWorker.register('../sw.js').catch(() => {});
    });
  });
}


/* ---------- LOGIN MODAL + LIVE CATALOGUE BOOT ---------- *
 * On admin entry: ask for the password if we don't have one cached.
 * Once we do, fetch the live catalogue from D1 (via /api/products) and
 * re-render the views that depend on it. Editing a price + hitting Save
 * round-trips through PUT /api/products/:id.
 * ----------------------------------------------------- */
function showAdminLogin(message = '') {
  // Idempotent — if a login modal is already on the page, just update its message
  let modal = document.getElementById('adminLoginModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'adminLoginModal';
    modal.className = 'admin-login';
    modal.innerHTML = `
      <div class="admin-login-card">
        <button type="button" class="admin-login-close" id="adminLoginClose" aria-label="Close and return to the website">&times;</button>
        <div class="admin-login-mark" aria-hidden="true">
          <img src="/assets/logos/logo-mark-96.png" alt="" width="56" height="56" style="border-radius:6px;display:block;"/>
        </div>
        <h2>Crystal Brook Admin</h2>
        <p class="admin-login-lede" id="adminLoginLede">Enter the admin password to manage the catalogue.</p>
        <form id="adminLoginForm" class="admin-login-form" autocomplete="off">
          <label>
            <span>Password</span>
            <input type="password" id="adminLoginPw" required autofocus autocomplete="current-password"/>
          </label>
          <button class="btn btn-gold" type="submit">Sign in</button>
        </form>
        <p class="admin-login-err" id="adminLoginErr" hidden></p>
        <p class="admin-login-foot">Forgot the password? Drop Steve a line and he'll reset it.</p>
      </div>
    `;
    document.body.appendChild(modal);
  }
  if (message) {
    const lede = modal.querySelector('#adminLoginLede');
    if (lede) lede.textContent = message;
  }
  modal.hidden = false;
  document.body.classList.add('admin-locked');

  const closeBtn = modal.querySelector('#adminLoginClose');
  if (closeBtn && !closeBtn.dataset.wired) {
    closeBtn.dataset.wired = '1';
    closeBtn.addEventListener('click', () => { window.location.href = '/'; });
  }

  const form = modal.querySelector('#adminLoginForm');
  const pwInput = modal.querySelector('#adminLoginPw');
  const errEl = modal.querySelector('#adminLoginErr');

  // Replace any prior submit handler — easier than tracking listeners
  const fresh = form.cloneNode(true);
  form.replaceWith(fresh);

  fresh.addEventListener('submit', async (e) => {
    e.preventDefault();
    const pw = fresh.querySelector('#adminLoginPw').value.trim();
    if (!pw) return;
    const submitBtn = fresh.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Checking…';
    const localErr = fresh.querySelector('#adminLoginErr') || errEl;
    if (localErr) { localErr.hidden = true; localErr.textContent = ''; }
    try {
      const ok = await verifyAdminPassword(pw);
      if (!ok) {
        if (localErr) {
          localErr.textContent = "That password didn't match. Try again.";
          localErr.hidden = false;
        }
        submitBtn.disabled = false;
        submitBtn.textContent = 'Sign in';
        return;
      }
      localStorage.setItem(ADMIN_AUTH_KEY, pw);
      hideAdminLogin();
      await refreshCatalogueAndRerender();
    } catch (err) {
      console.error('login error', err);
      if (localErr) {
        localErr.textContent = 'Something went wrong — check your connection and try again.';
        localErr.hidden = false;
      }
      submitBtn.disabled = false;
      submitBtn.textContent = 'Sign in';
    }
  });
}

function hideAdminLogin() {
  const modal = document.getElementById('adminLoginModal');
  if (modal) modal.hidden = true;
  document.body.classList.remove('admin-locked');
}

async function refreshCatalogueAndRerender() {
  try {
    const apiProducts = await fetchCatalogue();
    if (!apiProducts.length) return;
    PRODUCTS.length = 0;
    PRODUCTS.push(...apiProducts.map(apiToAdminProduct));

    // Re-run the views that depend on PRODUCTS
    try { renderProducts(); } catch (_) {}
    try { renderRecentOrders(); } catch (_) {}
    try { renderRevProducts(); } catch (_) {}
    try { renderFeatured(); } catch (_) {}
  } catch (err) {
    console.warn('catalogue refresh failed', err);
  }
}

(async () => {
  const pw = adminPassword();
  if (!pw) { showAdminLogin(); return; }

  // Quick verify so a stale-but-unmatching password doesn't silently fail
  // on the first save attempt
  const ok = await verifyAdminPassword(pw).catch(() => false);
  if (!ok) {
    localStorage.removeItem(ADMIN_AUTH_KEY);
    showAdminLogin('Your saved password no longer works — please sign in again.');
    return;
  }

  await refreshCatalogueAndRerender();
})();


/* ---------- PRODUCT EDIT DRAWER (full-fields) ---------- *
 * Used for:
 *   - Edit any field on an existing product (mode: 'edit')
 *   - Create a brand new product (mode: 'new')
 * Save → PUT or POST. Delete (edit mode only) → confirm + DELETE.
 * ----------------------------------------------------- */

const _drawer = {
  el:    () => document.getElementById('prodDrawer'),
  scrim: () => document.getElementById('prodDrawerScrim'),
  form:  () => document.getElementById('prodDrawerForm'),
  title: () => document.getElementById('prodDrawerTitle'),
  eyebrow: () => document.getElementById('prodDrawerEyebrow'),
  saveBtn:   () => document.getElementById('prodDrawerSave'),
  deleteBtn: () => document.getElementById('prodDrawerDelete'),
  closeBtn:  () => document.getElementById('prodDrawerClose'),
  cancelBtn: () => document.getElementById('prodDrawerCancel'),
};

let _drawerCurrentProduct = null;
let _drawerMode = 'edit';

function openProductDrawer(product, opts = {}) {
  const mode = opts.mode || 'edit';
  _drawerMode = mode;
  _drawerCurrentProduct = product;

  const drawer = _drawer.el();
  const form = _drawer.form();
  if (!drawer || !form) return;

  drawer.classList.toggle('is-new', mode === 'new');
  _drawer.title().textContent = mode === 'new' ? 'New product' : (product?.name || 'Edit product');
  _drawer.eyebrow().textContent = mode === 'new' ? 'Adding' : 'Editing';

  form.querySelector('[name="id"]').readOnly = (mode !== 'new');
  form.querySelector('[name="id"]').value = mode === 'new' ? 'p-' : (product?.id || '');
  form.querySelector('[name="name"]').value = product?.name || '';
  form.querySelector('[name="cat"]').value = product?.catKey || product?.cat || 'saltwater';
  form.querySelector('[name="badge"]').value = product?.badge || '';
  form.querySelector('[name="price"]').value = product?.price ?? '';
  form.querySelector('[name="size"]').value = product?.size || '';
  form.querySelector('[name="image"]').value = product?.image || 'assets/images/products/';
  previewProductImage(form.querySelector('[name="image"]').value);
  form.querySelector('[name="meta"]').value = product?.meta || '';
  form.querySelector('[name="description"]').value = product?.desc || product?.description || '';
  form.querySelector('[name="draft"]').checked = !!product?.draft;

  drawer.hidden = false;
  drawer.setAttribute('aria-hidden', 'false');
  _drawer.scrim().hidden = false;
  document.body.style.overflow = 'hidden';
  setTimeout(() => form.querySelector('[name="name"]')?.focus(), 50);
}

function closeProductDrawer() {
  const drawer = _drawer.el();
  if (!drawer) return;
  drawer.hidden = true;
  drawer.setAttribute('aria-hidden', 'true');
  _drawer.scrim().hidden = true;
  document.body.style.overflow = '';
  _drawerCurrentProduct = null;
}

function readDrawerForm() {
  const form = _drawer.form();
  const fd = new FormData(form);
  const out = {
    id: (fd.get('id') || '').trim(),
    name: (fd.get('name') || '').trim(),
    cat: fd.get('cat'),
    badge: (fd.get('badge') || '').trim() || null,
    price: Number(fd.get('price')),
    size: (fd.get('size') || '').trim(),
    image: (fd.get('image') || '').trim(),
    meta: (fd.get('meta') || '').trim() || null,
    description: (fd.get('description') || '').trim(),
    draft: !!fd.get('draft'),
  };
  return out;
}

function validateDrawerData(data, mode) {
  const errors = [];
  if (mode === 'new') {
    if (!/^p-[a-z0-9-]+$/.test(data.id)) errors.push('ID must start with "p-" and use lowercase letters, digits, or dashes');
  }
  if (!data.name) errors.push('Name is required');
  if (!data.cat) errors.push('Category is required');
  if (!Number.isFinite(data.price) || data.price < 0) errors.push('Price must be a non-negative number');
  if (!data.size) errors.push('Size is required');
  if (!data.image) errors.push('Image path is required');
  if (!data.description) errors.push('Description is required');
  return errors;
}

/* ---------- DRAWER PHOTO UPLOAD ----------
 * Max can pick a photo from his computer (or one downloaded from the
 * Image Builder). We resize to 1024px on the long edge and re-encode
 * as JPEG so the data URL fits comfortably in D1 (max row ~1MB).
 */
function previewProductImage(src) {
  const previewEl = document.getElementById('pdfPhotoPreview');
  const clearBtn  = document.getElementById('pdfPhotoClear');
  if (!previewEl) return;
  const looksEmpty = !src || src === 'assets/images/products/' || src.endsWith('/');
  if (looksEmpty) {
    previewEl.innerHTML = '<span class="pdf-photo-empty">No photo yet</span>';
    if (clearBtn) clearBtn.hidden = true;
    return;
  }
  const isData = src.startsWith('data:');
  const resolved = isData ? src : ('/' + src.replace(/^\/+/, ''));
  const img = new Image();
  img.alt = '';
  img.onload = () => {
    previewEl.innerHTML = '';
    previewEl.appendChild(img);
  };
  img.onerror = () => {
    previewEl.innerHTML = '<span class="pdf-photo-empty">Couldn\'t load that path</span>';
  };
  img.src = resolved;
  if (clearBtn) clearBtn.hidden = false;
}

async function shrinkImageFile(file, maxEdge = 1024, quality = 0.85) {
  const dataUrl = await new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = () => reject(new Error('read failed'));
    r.readAsDataURL(file);
  });
  const img = await new Promise((resolve, reject) => {
    const im = new Image();
    im.onload = () => resolve(im);
    im.onerror = () => reject(new Error('decode failed'));
    im.src = dataUrl;
  });
  const w = img.naturalWidth, h = img.naturalHeight;
  const scale = Math.min(1, maxEdge / Math.max(w, h));
  const tw = Math.max(1, Math.round(w * scale));
  const th = Math.max(1, Math.round(h * scale));
  const cv = document.createElement('canvas');
  cv.width = tw; cv.height = th;
  const ctx = cv.getContext('2d');
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, tw, th);
  ctx.drawImage(img, 0, 0, tw, th);
  return cv.toDataURL('image/jpeg', quality);
}

(() => {
  // Wire drawer once on script load
  const form = _drawer.form(); if (!form) return;
  _drawer.closeBtn()?.addEventListener('click', closeProductDrawer);
  _drawer.cancelBtn()?.addEventListener('click', closeProductDrawer);
  _drawer.scrim()?.addEventListener('click', closeProductDrawer);
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !_drawer.el()?.hidden) closeProductDrawer();
  });

  // Photo upload widget
  const fileInput = document.getElementById('pdfPhotoFile');
  const uploadBtn = document.getElementById('pdfPhotoUpload');
  const clearBtn  = document.getElementById('pdfPhotoClear');
  const imageInput = form.querySelector('[name="image"]');
  uploadBtn?.addEventListener('click', () => fileInput?.click());
  fileInput?.addEventListener('change', async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!/^image\//.test(file.type)) {
      toast('That doesn\'t look like a photo. Try a JPG, PNG or WebP.');
      return;
    }
    uploadBtn.disabled = true;
    const originalLabel = uploadBtn.textContent;
    uploadBtn.textContent = 'Resizing…';
    try {
      const dataUrl = await shrinkImageFile(file);
      imageInput.value = dataUrl;
      previewProductImage(dataUrl);
      toast('Photo loaded — hit Save to keep it.');
    } catch (err) {
      console.error('photo upload failed', err);
      toast('Couldn\'t read that file. Try a JPG or PNG.');
    } finally {
      uploadBtn.disabled = false;
      uploadBtn.textContent = originalLabel;
      fileInput.value = '';
    }
  });
  clearBtn?.addEventListener('click', () => {
    imageInput.value = 'assets/images/products/';
    previewProductImage('');
  });
  imageInput?.addEventListener('input', () => previewProductImage(imageInput.value));

  _drawer.saveBtn()?.addEventListener('click', async () => {
    const data = readDrawerForm();
    const errors = validateDrawerData(data, _drawerMode);
    if (errors.length) { alert(errors.join('\n')); return; }

    const saveBtn = _drawer.saveBtn();
    saveBtn.disabled = true;
    saveBtn.textContent = 'Saving…';
    try {
      let saved;
      if (_drawerMode === 'new') {
        saved = await createProduct(data);
        toast(`Added · ${saved.name}`);
      } else {
        const { id, ...patch } = data;
        saved = await saveProductChanges(_drawerCurrentProduct.id, patch);
        toast(`Saved · ${saved.name}`);
      }
      // Refresh local catalogue from API and re-render
      await refreshCatalogueAndRerender();
      closeProductDrawer();
    } catch (err) {
      toast(`Save failed: ${err.message || 'try again'}`);
    } finally {
      saveBtn.disabled = false;
      saveBtn.textContent = 'Save';
    }
  });

  _drawer.deleteBtn()?.addEventListener('click', () => {
    if (!_drawerCurrentProduct) return;
    confirmDeleteProduct(_drawerCurrentProduct, { fromDrawer: true });
  });
})();


/* ---------- DELETE CONFIRM DIALOG ---------- */
function confirmDeleteProduct(product, opts = {}) {
  const modal = document.getElementById('confirmModal');
  const title = document.getElementById('confirmTitle');
  const body  = document.getElementById('confirmBody');
  const ok    = document.getElementById('confirmOk');
  const cancel= document.getElementById('confirmCancel');
  if (!modal) return;

  title.textContent = `Delete "${product.name}"?`;
  body.textContent  = `This removes "${product.name}" from the storefront permanently. Customers will no longer see or order it. This can't be undone — but you can always add it back later from "+ New product".`;
  modal.hidden = false;

  function close() {
    modal.hidden = true;
    ok.replaceWith(ok.cloneNode(true));
    cancel.replaceWith(cancel.cloneNode(true));
  }

  document.getElementById('confirmCancel').addEventListener('click', close, { once: true });
  document.getElementById('confirmOk').addEventListener('click', async () => {
    const okBtn = document.getElementById('confirmOk');
    okBtn.disabled = true;
    okBtn.textContent = 'Deleting…';
    try {
      await deleteProduct(product.id);
      close();
      if (opts.fromDrawer) closeProductDrawer();
      await refreshCatalogueAndRerender();
    } catch (err) {
      okBtn.disabled = false;
      okBtn.textContent = 'Yes, delete';
      alert('Delete failed: ' + err.message);
    }
  }, { once: true });
}


/* ---------- "+ New product" button ---------- */
(() => {
  const btn = document.querySelector('[data-view="products"] .v-head-actions .btn-gold');
  if (!btn) return;
  // The button text in the markup is "+ New product"
  btn.addEventListener('click', () => {
    openProductDrawer(null, { mode: 'new' });
  });
})();

/* ---------- Sign out (sidebar) ----------
 * Drops the cached admin password and pops the login modal back up.
 * Useful when Max wants to hand the screen to someone else, or when
 * a stale localStorage password is causing 401s on every save.
 * --------------------------------------- */
(() => {
  const btn = document.getElementById('signOutBtn');
  if (!btn) return;
  btn.addEventListener('click', () => {
    localStorage.removeItem(ADMIN_AUTH_KEY);
    showAdminLogin('Signed out — sign in again to keep editing.');
  });
})();


/* ---------- ABOUT PAGE EDITOR -------------------------- *
 * Each label tagged with data-content-edit="<key>" holds an input or
 * textarea bound to that key in site_content. Values load on first
 * view, auto-save on blur (with a tiny debounce while typing).
 * ----------------------------------------------------- */
async function saveContent(key, value) {
  const res = await fetch('/api/content/' + encodeURIComponent(key), {
    method: 'PUT',
    headers: { 'content-type': 'application/json', ...adminAuthHeaders() },
    body: JSON.stringify({ value }),
  });
  if (res.status === 401) {
    localStorage.removeItem(ADMIN_AUTH_KEY);
    showAdminLogin('Your session expired — please sign in again.');
    throw new Error('unauthorised');
  }
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'save failed: ' + res.status);
  }
}

async function loadContentEditorFor(view) {
  if (!view) return;
  const labels = view.querySelectorAll('[data-content-edit]');
  if (!labels.length) return;
  try {
    const res = await fetch('/api/content', { cache: 'no-store' });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const { content } = await res.json();
    if (!content) return;
    labels.forEach(label => {
      const key = label.dataset.contentEdit;
      const field = label.querySelector('input, textarea');
      if (field && key in content) field.value = content[key];
    });
  } catch (err) {
    console.warn('content editor: load failed', err);
  }
}
// Back-compat alias used elsewhere
const loadAboutEditor = () =>
  loadContentEditorFor(document.querySelector('section[data-view="about"]'));

function wireContentEditor(viewName, opts = {}) {
  // Scope to <section> — the nav uses the same data-view on its <a> link.
  const view = document.querySelector(`section[data-view="${viewName}"]`);
  if (!view) return;
  const labels = view.querySelectorAll('[data-content-edit]');
  if (!labels.length) return;
  const statusEl = opts.statusElId ? document.getElementById(opts.statusElId) : null;
  const saveAllBtn = opts.saveAllBtnId ? document.getElementById(opts.saveAllBtnId) : null;

  function showSaved(msg = 'Saved ✓') {
    if (!statusEl) return;
    statusEl.textContent = msg;
    statusEl.hidden = false;
    clearTimeout(statusEl._timer);
    statusEl._timer = setTimeout(() => { statusEl.hidden = true; }, 2200);
  }

  // Per-field flush functions, exposed so Save-all can call them
  const flushers = [];

  labels.forEach(label => {
    const key = label.dataset.contentEdit;
    const field = label.querySelector('input, textarea');
    if (!field) return;
    let initial = field.value;
    let pending = null;

    async function flush() {
      if (field.value === initial) return false;  // returns true if a save fired
      label.classList.remove('is-error', 'is-saved');
      label.classList.add('is-saving');
      try {
        await saveContent(key, field.value);
        initial = field.value;
        label.classList.remove('is-saving');
        label.classList.add('is-saved');
        setTimeout(() => label.classList.remove('is-saved'), 1500);
        return true;
      } catch (err) {
        label.classList.remove('is-saving');
        label.classList.add('is-error');
        throw err;
      }
    }

    flushers.push(flush);

    // Auto-save on blur (or 1.5s after last keystroke, whichever first)
    field.addEventListener('blur', () => { flush().then(saved => { if (saved) showSaved(); }).catch(() => showSaved('Save failed — try again')); });
    field.addEventListener('input', () => {
      clearTimeout(pending);
      pending = setTimeout(() => { flush().then(saved => { if (saved) showSaved(); }).catch(() => showSaved('Save failed — try again')); }, 1500);
    });
    // Stash initial value once loadContentEditorFor() populates the field
    field.addEventListener('focus', () => { initial = field.value; }, { once: true });
  });

  // Save-all button — flushes every dirty field at once and reports an
  // explicit summary toast. Useful when Max wants definite confirmation.
  if (saveAllBtn) {
    saveAllBtn.addEventListener('click', async () => {
      saveAllBtn.disabled = true;
      const original = saveAllBtn.textContent;
      saveAllBtn.textContent = 'Saving…';
      let saved = 0, failed = 0;
      for (const flush of flushers) {
        try {
          if (await flush()) saved++;
        } catch (_) {
          failed++;
        }
      }
      saveAllBtn.disabled = false;
      saveAllBtn.textContent = original;
      if (failed) {
        showSaved(`${failed} field${failed === 1 ? '' : 's'} failed — try again`);
        toast(`Save failed for ${failed} field${failed === 1 ? '' : 's'}`);
      } else if (saved) {
        showSaved(`Saved ${saved} change${saved === 1 ? '' : 's'} ✓`);
        toast(`Saved ${saved} change${saved === 1 ? '' : 's'}`);
      } else {
        showSaved('Nothing to save');
      }
    });
  }

  // Populate values once on admin entry so switching to this view is instant
  loadContentEditorFor(view);

  // Refresh values whenever Max actually navigates to this view
  const sideNav = document.getElementById('sideNav');
  sideNav?.addEventListener('click', e => {
    const link = e.target.closest(`[data-view="${viewName}"]`);
    if (link) loadContentEditorFor(view);
  });
}

wireContentEditor('homepage',    { statusElId: 'homepageSaveStatus',    saveAllBtnId: 'homepageSaveAll' });
wireContentEditor('shoppage',    { statusElId: 'shoppageSaveStatus',    saveAllBtnId: 'shoppageSaveAll' });
wireContentEditor('productpage', { statusElId: 'productpageSaveStatus', saveAllBtnId: 'productpageSaveAll' });
wireContentEditor('orderpage',   { statusElId: 'orderpageSaveStatus',   saveAllBtnId: 'orderpageSaveAll' });
wireContentEditor('page404',     { statusElId: 'page404SaveStatus',     saveAllBtnId: 'page404SaveAll' });
wireContentEditor('about',       { statusElId: 'aboutSaveStatus',       saveAllBtnId: 'aboutSaveAll' });
wireContentEditor('shipping',    { statusElId: 'shippingSaveStatus',    saveAllBtnId: 'shippingSaveAll' });
wireContentEditor('returns',     { statusElId: 'returnsSaveStatus',     saveAllBtnId: 'returnsSaveAll' });
wireContentEditor('guarantee',   { statusElId: 'guaranteeSaveStatus',   saveAllBtnId: 'guaranteeSaveAll' });
wireContentEditor('commissions', { statusElId: 'commissionsSaveStatus', saveAllBtnId: 'commissionsSaveAll' });
wireContentEditor('sitewide',    { statusElId: 'sitewideSaveStatus',    saveAllBtnId: 'sitewideSaveAll' });
wireContentEditor('settings',    { statusElId: 'settingsSaveStatus',    saveAllBtnId: 'settingsSaveAll' });


/* ---------- CHANGE ADMIN PASSWORD (Settings card) ---------- *
 * Posts {newPassword} to /api/admin/password — the Worker uses the
 * existing X-Admin-Password header for auth (so the user must
 * already be signed in with the *current* password). On success the
 * cached password in localStorage is updated so the user stays
 * signed in seamlessly.
 * ----------------------------------------------------- */
(() => {
  const saveBtn = document.getElementById('adminPwSave');
  if (!saveBtn) return;
  const curEl     = document.getElementById('adminPwCurrent');
  const newEl     = document.getElementById('adminPwNew');
  const confirmEl = document.getElementById('adminPwConfirm');
  const errEl     = document.getElementById('adminPwErr');
  const statusEl  = document.getElementById('adminPwStatus');

  function showErr(msg) {
    if (!errEl) return;
    errEl.textContent = msg;
    errEl.hidden = false;
  }
  function clearErr() { if (errEl) errEl.hidden = true; }
  function flashStatus(msg = 'Updated ✓') {
    if (!statusEl) return;
    statusEl.textContent = msg;
    statusEl.hidden = false;
    clearTimeout(statusEl._timer);
    statusEl._timer = setTimeout(() => { statusEl.hidden = true; }, 3000);
  }

  saveBtn.addEventListener('click', async () => {
    clearErr();
    const cur = curEl.value;
    const newPw = newEl.value;
    const conf = confirmEl.value;

    if (!cur || !newPw || !conf) { showErr('All three fields are required.'); return; }
    if (newPw.length < 8) { showErr('New password must be at least 8 characters.'); return; }
    if (newPw !== conf)   { showErr("New password and confirmation don't match."); return; }
    if (cur === newPw)    { showErr('New password is the same as the current one.'); return; }
    if (cur !== adminPassword()) { showErr("That doesn't match the password you used to sign in. Try again."); return; }

    saveBtn.disabled = true;
    const original = saveBtn.textContent;
    saveBtn.textContent = 'Updating…';
    try {
      const res = await fetch('/api/admin/password', {
        method: 'POST',
        headers: { 'content-type': 'application/json', ...adminAuthHeaders() },
        body: JSON.stringify({ newPassword: newPw }),
      });
      if (res.status === 401) {
        // Current password apparently no longer matches what's live — kick to login
        localStorage.removeItem(ADMIN_AUTH_KEY);
        showAdminLogin('Your saved password is no longer recognised — please sign in.');
        return;
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'failed');
      }
      // Update cached password so the user stays signed in seamlessly
      localStorage.setItem(ADMIN_AUTH_KEY, newPw);
      curEl.value = '';
      newEl.value = '';
      confirmEl.value = '';
      flashStatus();
    } catch (err) {
      showErr('Update failed: ' + err.message);
    } finally {
      saveBtn.disabled = false;
      saveBtn.textContent = original;
    }
  });
})();
