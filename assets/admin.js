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
    img: (api.name || '?').trim().charAt(0).toUpperCase(),
  };
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

const ORDERS = [
  { id:'#10482', cust:'Jack T.',      email:'jack@example.com',   items:'Coral Trout',                          total:485, status:'paid',      pay:'Stripe · Visa', date:'Today · 2:14pm' },
  { id:'#10481', cust:'Sarah M.',     email:'sarah@example.com',  items:'Wedge-Tailed Eagle',                   total:620, status:'production',pay:'Stripe · MC',   date:'Today · 10:02am' },
  { id:'#10480', cust:'Dave K.',      email:'dave@example.com',   items:'Blue Marlin',                          total:760, status:'shipped',   pay:'Stripe · AMEX', date:'Yest · 6:48pm' },
  { id:'#10479', cust:'Louise B.',    email:'louise@example.com', items:'French Bulldog Puppy',                 total:425, status:'paid',      pay:'Stripe · Visa', date:'Yest · 1:20pm' },
  { id:'#10478', cust:'Mitchell R.',  email:'mitch@example.com',  items:'1971 Mach-1 Mustang',                  total:625, status:'production',pay:'PayPal',        date:'2 days ago' },
  { id:'#10477', cust:'Hayley W.',    email:'hay@example.com',    items:'Barramundi + Murray Cod',              total:1035,status:'shipped',   pay:'Stripe · Visa', date:'3 days ago' },
  { id:'#10476', cust:'Tom P.',       email:'tom@example.com',    items:'Kangaroo',                             total:520, status:'shipped',   pay:'Stripe · Visa', date:'4 days ago' },
  { id:'#10475', cust:'Renee J.',     email:'renee@example.com',  items:'Rainbow Lorikeet',                     total:385, status:'refunded',  pay:'Stripe · Visa', date:'5 days ago' },
];

const CUSTOM_ORDERS = {
  'New': [
    { name:'Ben Harrison',  subject:'Marlin caught at Fraser · 1.8m',  size:'XL', budget:'$1,500', due:'2 days ago' },
    { name:'Chloe Davis',   subject:'Golden retriever memorial',       size:'M',  budget:'$700',  due:'Today' },
    { name:'Paul Whitmore', subject:'1969 Torana GTR-X restoration',   size:'L',  budget:'$1,200', due:'Today' },
  ],
  'Quoted': [
    { name:'Jess Kim',      subject:'Murray cod release shot',         size:'M',  budget:'$850',  due:'3 days left' },
    { name:'Anton Liakos',  subject:'HSV Clubsport R8',                size:'L',  budget:'$1,100', due:'5 days left' },
  ],
  'In Production': [
    { name:'Dean Walters',  subject:'Cobia 1.4m — Hervey Bay',         size:'L',  budget:'$1,100', due:'ETA 28 Apr' },
    { name:'Karen Liu',     subject:'Blue Heeler · working dog',       size:'M',  budget:'$750',  due:'ETA 30 Apr' },
  ],
  'Completed': [
    { name:'Steve Rowe',    subject:'Saratoga release shot',           size:'M',  budget:'$820',  due:'Shipped 18 Apr' },
    { name:'Priya Nathan',  subject:'1967 Mustang Fastback',           size:'XL', budget:'$1,800', due:'Shipped 15 Apr' },
  ],
};

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
    paid:       { cls:'info', label:'Paid' },
    production: { cls:'warn', label:'In production' },
    shipped:    { cls:'ok',   label:'Shipped' },
    refunded:   { cls:'muted',label:'Refunded' },
  };
  return map[s];
}

/* ---------- DASHBOARD ---------- */
function renderRecentOrders(){
  const tb = document.getElementById('recentOrders');
  tb.innerHTML = ORDERS.slice(0,5).map(o=>{
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
function renderRevenueBars(){
  const el = document.getElementById('revBars'); if(!el) return;
  const data = [ 8400, 9200, 11100, 12400, 10500, 13800, 16200, 22400, 14800, 15600, 17200, 18420 ];
  const labels = ['May','Jun','Jul','Aug','Sep','Oct','Nov','Dec','Jan','Feb','Mar','Apr'];
  const W = 800, H = 280, pad = 30;
  const max = Math.max(...data);
  const bw = (W - pad*2) / data.length * 0.65;
  const step = (W - pad*2) / data.length;
  const bars = data.map((v,i)=>{
    const h = (v / max) * (H - pad*2);
    const x = pad + i*step + (step - bw)/2;
    const y = H - pad - h;
    return `<rect x="${x}" y="${y}" width="${bw}" height="${h}" rx="3" fill="url(#barGrad)"/>
            <text x="${x + bw/2}" y="${H-8}" fill="#7a6e5c" font-size="10" text-anchor="middle" font-family="Inter">${labels[i]}</text>
            <text x="${x + bw/2}" y="${y - 6}" fill="#b8a989" font-size="10" text-anchor="middle" font-family="Inter">$${(v/1000).toFixed(1)}k</text>`;
  }).join('');
  el.innerHTML = `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none">
    <defs><linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#e8d5a0"/><stop offset="100%" stop-color="#a9864b"/>
    </linearGradient></defs>
    ${bars}
  </svg>`;
}
renderRevenueBars();

/* Category bars list */
function renderCatBars(){
  const el = document.getElementById('catBars'); if(!el) return;
  const cats = [
    { name:'Saltwater Fish',  val:62400, pct:34 },
    { name:'Freshwater Fish', val:38200, pct:21 },
    { name:'Cars',            val:32800, pct:18 },
    { name:'Animals',         val:26400, pct:14 },
    { name:'Birds',           val:24450, pct:13 },
  ];
  el.innerHTML = cats.map(c=>`
    <li>
      <div class="bar-row"><span>${c.name}</span><strong>$${c.val.toLocaleString()} · ${c.pct}%</strong></div>
      <div class="bar-track"><div class="bar-fill" style="width:${c.pct}%"></div></div>
    </li>
  `).join('');
}
renderCatBars();

/* Revenue products table */
function renderRevProducts(){
  const tb = document.getElementById('revProducts'); if(!tb) return;
  const rows = [
    { name:'Coral Trout',            cat:'Saltwater Fish', units:34, rev:16490, mar:42 },
    { name:'Murray Cod',             cat:'Freshwater Fish',units:18, rev: 9720, mar:44 },
    { name:'Blue Marlin',            cat:'Saltwater Fish', units:10, rev: 7600, mar:41 },
    { name:'1971 Mach-1 Mustang',    cat:'Cars',           units:12, rev: 7500, mar:44 },
    { name:'French Bulldog Puppy',   cat:'Animals',        units:16, rev: 6800, mar:46 },
    { name:'Wedge-Tailed Eagle',     cat:'Birds',          units: 9, rev: 5580, mar:40 },
    { name:'Rainbow Lorikeet',       cat:'Birds',          units:14, rev: 5390, mar:48 },
  ];
  tb.innerHTML = rows.map(r=>`
    <tr>
      <td>${r.name}</td>
      <td><span class="status muted">${r.cat}</span></td>
      <td>${r.units}</td>
      <td>$${r.rev.toLocaleString()}</td>
      <td>${r.mar}%</td>
    </tr>
  `).join('');
}
renderRevProducts();

/* ---------- PRODUCTS / STOCKTAKE ---------- *
 * Each row's Price and Size are inline-editable. Hitting Save PUTs the
 * change to /api/products/:id; the row's "edited" pill goes back to a
 * green tick when the write succeeds.
 * ----------------------------------------------------- */
function renderProducts(filter='all', q=''){
  const body = document.getElementById('productsBody'); if(!body) return;
  let list = PRODUCTS.slice();
  if(q){
    const s = q.toLowerCase();
    list = list.filter(p=>p.name.toLowerCase().includes(s) || (p.sku||'').toLowerCase().includes(s));
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
            <div class="cell-thumb">${p.img}</div>
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

document.querySelectorAll('[data-view="products"] .tab').forEach(tab=>{
  tab.addEventListener('click', ()=>{
    document.querySelectorAll('[data-view="products"] .tab').forEach(t=>t.classList.remove('is-active'));
    tab.classList.add('is-active');
    renderProducts(tab.dataset.filter, document.getElementById('prodSearch').value);
  });
});
document.getElementById('prodSearch')?.addEventListener('input', e=>{
  const active = document.querySelector('[data-view="products"] .tab.is-active');
  renderProducts(active?.dataset.filter || 'all', e.target.value);
});

/* ---------- ORDERS ---------- */
function renderOrders(){
  const tb = document.getElementById('ordersBody'); if(!tb) return;
  tb.innerHTML = ORDERS.map(o=>{
    const st = orderStatus(o.status);
    return `<tr>
      <td><input type="checkbox"/></td>
      <td><strong>${o.id}</strong></td>
      <td>${o.cust}<span class="cell-sub">${o.email}</span></td>
      <td>${o.items}</td>
      <td>$${o.total.toLocaleString()}</td>
      <td><span class="status ${st.cls}">${st.label}</span></td>
      <td>${o.pay}</td>
      <td>${o.date}</td>
      <td><div class="row-act"><button class="iact" title="View"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12Z"/><circle cx="12" cy="12" r="3"/></svg></button></div></td>
    </tr>`;
  }).join('');
}
renderOrders();

/* ---------- CUSTOM ORDERS KANBAN ---------- */
function renderKanban(){
  const kb = document.getElementById('kanban'); if(!kb) return;

  // Pull any "Request a piece" submissions from the storefront's localStorage
  // and prepend them to the New column. They have no photo or quote — just a
  // text brief — so we render a lightweight variant with a "Request" tag.
  let live = [];
  try { live = JSON.parse(localStorage.getItem('cbwm_requests') || '[]'); } catch(_) {}
  const liveCards = live.map(r => ({
    name: r.name || 'Anonymous',
    subject: r.subject || '(no subject)',
    size: r.size ? r.size.toUpperCase() : '—',
    budget: 'Awaiting quote',
    due: 'Just in',
    isRequest: true,
    category: r.category || '',
  }));

  const merged = { ...CUSTOM_ORDERS, New: [...liveCards, ...CUSTOM_ORDERS.New] };

  kb.innerHTML = Object.entries(merged).map(([title, cards])=>`
    <div class="kcol">
      <div class="kcol-head"><strong>${title}</strong><span>${cards.length}</span></div>
      ${cards.map(c=>`
        <div class="kcard${c.isRequest ? ' is-request' : ''}" draggable="true">
          ${c.isRequest ? '<span class="kcard-pill">Request</span>' : ''}
          <div class="kcard-name">${c.name}</div>
          <div class="kcard-sub">${c.subject}</div>
          <div class="kcard-row">
            <span class="kcard-tag">${c.size} · ${c.budget}</span>
            <span>${c.due}</span>
          </div>
        </div>
      `).join('')}
    </div>
  `).join('');
}
renderKanban();

/* ---------- HOMEPAGE EDITOR · sortable featured list ---------- */
function renderFeatured(){
  const el = document.getElementById('featSortable'); if(!el) return;
  const featured = PRODUCTS.slice(0,8);
  el.innerHTML = featured.map(p=>`
    <li draggable="true" data-id="${p.id}">
      <span class="sort-handle">⋮⋮</span>
      <span class="sort-thumb">${p.img}</span>
      <span>
        <span class="sort-name">${p.name}</span>
        <span class="sort-sub">${p.cat} · $${p.price}</span>
      </span>
      <button class="sort-rm" title="Remove">×</button>
    </li>
  `).join('');
  let dragged;
  el.querySelectorAll('li').forEach(li=>{
    li.addEventListener('dragstart', ()=>{ dragged = li; li.style.opacity=.4; });
    li.addEventListener('dragend',   ()=>{ li.style.opacity=1; dragged=null; });
    li.addEventListener('dragover',  e=> e.preventDefault());
    li.addEventListener('drop',      e=>{
      e.preventDefault();
      if(dragged && dragged!==li){
        const rect = li.getBoundingClientRect();
        const after = (e.clientY - rect.top) > rect.height/2;
        el.insertBefore(dragged, after ? li.nextSibling : li);
      }
    });
  });
}
renderFeatured();

/* ---------- HOLIDAY MODE ---------- */
(() => {
  const KEY = 'cbwm_holiday';
  const activeEl = document.getElementById('holidayActive');
  const untilEl  = document.getElementById('holidayUntil');
  const msgEl    = document.getElementById('holidayMsg');
  const pill     = document.getElementById('holidayStatusPill');
  if (!activeEl || !untilEl || !msgEl) return;

  function load(){
    try { return JSON.parse(localStorage.getItem(KEY) || '{}') || {}; }
    catch (_) { return {}; }
  }
  function save(state){
    localStorage.setItem(KEY, JSON.stringify(state));
  }
  function updatePill(state){
    if (!pill) return;
    const on = !!state.active;
    pill.dataset.state = on ? 'on' : 'off';
    pill.textContent = on ? 'On' : 'Off';
  }
  function read(){
    return {
      active: !!activeEl.checked,
      until: untilEl.value || '',
      message: msgEl.value || '',
    };
  }
  function commit(){
    const state = read();
    save(state);
    updatePill(state);
  }

  const initial = load();
  activeEl.checked = !!initial.active;
  untilEl.value    = initial.until || '';
  msgEl.value      = initial.message || msgEl.value;
  updatePill(initial);

  activeEl.addEventListener('change', commit);
  untilEl.addEventListener('change', commit);
  msgEl.addEventListener('input', commit);
})();

/* ---------- PUBLISH BUTTON ---------- */
document.getElementById('publishBtn')?.addEventListener('click', ()=>{
  toast('Homepage changes published.');
});

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
  // Export → fake CSV download
  if (l.includes('export')){
    const orig = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'Exporting…';
    setTimeout(() => {
      const headers = view === 'orders'
        ? 'Order,Customer,Items,Total,Status,Date'
        : view === 'revenue'
        ? 'Month,Revenue,Orders,AOV'
        : 'SKU,Name,Category,Price,Stock';
      const csv = headers + '\n';
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `crystalbrook-${view}-${new Date().toISOString().slice(0,10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      btn.disabled = false;
      btn.textContent = orig;
      toast(`✓ Exported ${view} CSV`);
    }, 700);
    return;
  }
  // + New product / + Manual order / + New quote / + Add product → modal
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

(() => {
  // Wire drawer once on script load
  const form = _drawer.form(); if (!form) return;
  _drawer.closeBtn()?.addEventListener('click', closeProductDrawer);
  _drawer.cancelBtn()?.addEventListener('click', closeProductDrawer);
  _drawer.scrim()?.addEventListener('click', closeProductDrawer);
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !_drawer.el()?.hidden) closeProductDrawer();
  });

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
      } else {
        const { id, ...patch } = data;
        saved = await saveProductChanges(_drawerCurrentProduct.id, patch);
      }
      // Refresh local catalogue from API and re-render
      await refreshCatalogueAndRerender();
      closeProductDrawer();
    } catch (err) {
      alert('Save failed: ' + err.message);
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

async function loadAboutEditor() {
  const view = document.querySelector('[data-view="about"]');
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
    console.warn('about editor: load failed', err);
  }
}

(() => {
  const view = document.querySelector('[data-view="about"]');
  if (!view) return;

  const labels = view.querySelectorAll('[data-content-edit]');
  const statusEl = document.getElementById('aboutSaveStatus');

  function showSaved(msg = 'Saved ✓') {
    if (!statusEl) return;
    statusEl.textContent = msg;
    statusEl.hidden = false;
    clearTimeout(statusEl._timer);
    statusEl._timer = setTimeout(() => { statusEl.hidden = true; }, 2200);
  }

  labels.forEach(label => {
    const key = label.dataset.contentEdit;
    const field = label.querySelector('input, textarea');
    if (!field) return;
    let initial = field.value;
    let pending = null;

    async function flush() {
      if (field.value === initial) return;
      label.classList.remove('is-error', 'is-saved');
      label.classList.add('is-saving');
      try {
        await saveContent(key, field.value);
        initial = field.value;
        label.classList.remove('is-saving');
        label.classList.add('is-saved');
        showSaved();
        setTimeout(() => label.classList.remove('is-saved'), 1500);
      } catch (err) {
        label.classList.remove('is-saving');
        label.classList.add('is-error');
        showSaved('Save failed — try again');
      }
    }

    // Auto-save on blur (or 1.5s after last keystroke, whichever first)
    field.addEventListener('blur', flush);
    field.addEventListener('input', () => {
      clearTimeout(pending);
      pending = setTimeout(flush, 1500);
    });
    // Stash initial value once loadAboutEditor() populates the field
    field.addEventListener('focus', () => { initial = field.value; }, { once: true });
  });

  // Load values when admin first lands on /admin (we may not be on the
  // About view yet, but populating ahead of time keeps switching snappy)
  loadAboutEditor();

  // If the admin navigates to the About view later, refresh values then too
  const sideNav = document.getElementById('sideNav');
  sideNav?.addEventListener('click', e => {
    const link = e.target.closest('[data-view="about"]');
    if (link) loadAboutEditor();
  });
})();


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
