/* ======================================================
   Crystal Brook Wall Mounts — admin app
   ====================================================== */

/* ---------- SAMPLE DATA ---------- */
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
  homepage:'Homepage Editor', settings:'Settings'
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

/* ---------- PRODUCTS / STOCKTAKE ---------- */
function renderProducts(filter='all', q=''){
  const body = document.getElementById('productsBody'); if(!body) return;
  let list = PRODUCTS.slice();
  if(q){
    const s = q.toLowerCase();
    list = list.filter(p=>p.name.toLowerCase().includes(s) || p.sku.toLowerCase().includes(s));
  }
  if(filter==='in')  list = list.filter(p=>p.stock>2);
  if(filter==='low') list = list.filter(p=>p.stock>0 && p.stock<=2);
  if(filter==='out') list = list.filter(p=>p.stock===0);

  body.innerHTML = list.map(p=>{
    const s = stockStatus(p.stock);
    return `
      <tr>
        <td><input type="checkbox"/></td>
        <td>
          <div class="cell-product">
            <div class="cell-thumb">${p.img}</div>
            <div>
              <strong>${p.name}</strong>
              <span class="cell-sub">${p.cat} · ${p.size}</span>
            </div>
          </div>
        </td>
        <td><span class="status muted">${p.cat}</span></td>
        <td>${p.sku}</td>
        <td>$${p.price.toLocaleString()}</td>
        <td>
          <strong>${p.stock}</strong>
          <div class="stock-bar ${s.bar}"><span style="width:${s.pct}%"></span></div>
        </td>
        <td><span class="status ${s.cls}">${s.label}</span></td>
        <td>
          <div class="row-act">
            <button class="iact" title="Edit"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg></button>
            <button class="iact" title="Delete"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14"/></svg></button>
          </div>
        </td>
      </tr>`;
  }).join('');

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
  kb.innerHTML = Object.entries(CUSTOM_ORDERS).map(([title, cards])=>`
    <div class="kcol">
      <div class="kcol-head"><strong>${title}</strong><span>${cards.length}</span></div>
      ${cards.map(c=>`
        <div class="kcard" draggable="true">
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

/* ---------- PUBLISH BUTTON ---------- */
document.getElementById('publishBtn')?.addEventListener('click', ()=>{
  toast('Homepage changes published.');
});

/* ---------- TOP-OF-VIEW ACTION BUTTONS (Import/Export/+ New …) ----------
 * The view headers (Stocktake, Orders, Quotes, Revenue, Settings) all
 * have action pills on the right that previously did nothing on click.
 * Wire them to sensible mockup actions so the admin feels responsive.
 * Real backend will swap these for actual API calls. */
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
      const csv = headers + '\n# (Mockup export — backend wiring pending)\n';
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
  // Export PDF → mockup
  if (l.includes('pdf')){
    toast('Building PDF report — coming soon');
    return;
  }
  toast(`"${label}" — coming soon`);
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
      toast('Saved (mockup) — wire backend to persist');
    });
  }
  const title = label.replace(/^\+\s*/, '').replace(/^./, c => c.toUpperCase());
  modal.querySelector('#adminModalTitle').textContent = title;
  modal.querySelector('#adminModalLede').textContent =
    `Quick form for ${view}. Backend wiring pending — fields here will POST to the Workers API once it lands.`;
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
    text: 'How much you charge to post pieces. Free shipping above the threshold helps push customers to bigger orders.' },
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
