/* ======================================================
   Crystal Brook Wall Mounts — storefront app.js
   ====================================================== */

const STD_DESC = "Resin-coated cut-out archival print, mounted on timber and resin-sealed by hand.";

const IMG = 'assets/images/products/';

const PRODUCTS = [
  /* ------- SALTWATER FISH ------- */
  { id:'p-coral',    name:'Coral Trout',          cat:'saltwater', price:485, size:'68 × 32 cm', pimg:'coral',     image:IMG+'coral.png',     badge:'Bestseller', meta:'Great Barrier Reef · Silky Oak mount', desc:'Iconic reef dweller rendered in vivid archival red with turquoise spot detail. ' + STD_DESC },
  { id:'p-marlin',   name:'Blue Marlin',          cat:'saltwater', price:760, size:'120 × 40 cm',pimg:'marlin',                              badge:'Signature',  meta:'Billfish · Ironbark mount',             desc:'Trophy-size blue marlin shown in full striking pose. ' + STD_DESC },
  { id:'p-mahi',     name:'Mahi Mahi (Dorado)',   cat:'saltwater', price:560, size:'90 × 34 cm', pimg:'mahi',      image:IMG+'mahi.png',      badge:null,         meta:'Pelagic · Blackwood mount',             desc:'Electric blue and gold dorado — the colour of a fresh catch. ' + STD_DESC },
  { id:'p-snapper',  name:'Red Emperor Snapper',  cat:'saltwater', price:425, size:'60 × 36 cm', pimg:'snapper',   image:IMG+'snapper.png',   badge:null,         meta:'Reef · Silky Oak mount',                desc:'Deep-reef red emperor with fin detail and subtle scale texture. ' + STD_DESC },
  { id:'p-gt',       name:'Giant Trevally',       cat:'saltwater', price:510, size:'78 × 38 cm', pimg:'gt',                                  badge:null,         meta:'Tropical reef · Ironbark mount',        desc:'The bruiser of the flats — silver flank with dark dorsal, built to hang large. ' + STD_DESC },
  { id:'p-mackerel', name:'Spanish Mackerel',     cat:'saltwater', price:535, size:'100 × 30 cm',pimg:'mackerel',  image:IMG+'bonus-mackerel.png', badge:'New',   meta:'Pelagic · Blackwood mount',             desc:'Silver-blue mackerel caught mid-cruise — a sleek pelagic predator. ' + STD_DESC },

  /* ------- FRESHWATER FISH ------- */
  { id:'p-barra',    name:'Barramundi',           cat:'freshwater',price:495, size:'72 × 30 cm', pimg:'barra',     image:IMG+'barra.png',     badge:null,         meta:'Top End river · Spotted Gum mount',     desc:'Classic Aussie barramundi, silver-green flank catching the light. ' + STD_DESC },
  { id:'p-cod',      name:'Murray Cod',           cat:'freshwater',price:540, size:'82 × 36 cm', pimg:'cod',       image:IMG+'cod.png',       badge:'Bestseller', meta:'Murray-Darling · River Red Gum mount',  desc:'The river king, captured in mottled green with its signature wide mouth. ' + STD_DESC },
  { id:'p-yellowb',  name:'Golden Perch · Yellowbelly', cat:'freshwater', price:445, size:'56 × 28 cm', pimg:'yellowbelly',                  badge:null,         meta:'Inland rivers · Spotted Gum mount',     desc:'Warm copper and gold — a classic Murray-Darling target. ' + STD_DESC },
  { id:'p-bass',     name:'Australian Bass',      cat:'freshwater',price:425, size:'50 × 26 cm', pimg:'bass',                                badge:null,         meta:'East-coast streams · Blackwood mount',  desc:'Dark-backed native bass in a compact vertical mount. ' + STD_DESC },
  { id:'p-toga',     name:'Saratoga',             cat:'freshwater',price:515, size:'70 × 28 cm', pimg:'toga',                                badge:'New',        meta:'NQ billabong · River Red Gum mount',    desc:'Prehistoric-looking saratoga with its distinctive pink scale dots. ' + STD_DESC },

  /* ------- CARS ------- */
  { id:'p-mustang',  name:'1971 Mach-1 Mustang',  cat:'cars',      price:625, size:'88 × 34 cm', pimg:'mustang',                             badge:null,         meta:'Muscle · Blackwood mount',              desc:'Yellow Mach-1 in profile with Magnum 500 wheels and side stripe detail. ' + STD_DESC },
  { id:'p-monaro',   name:'HQ Monaro GTS',        cat:'cars',      price:640, size:'88 × 34 cm', pimg:'monaro',    image:IMG+'monaro.png',    badge:'Signature',  meta:'Aussie muscle · Blackwood mount',       desc:'Lime-green HQ GTS with black side stripes — peak Aussie muscle. ' + STD_DESC },
  { id:'p-torana',   name:'1971 Torana SLR 5000', cat:'cars',      price:650, size:'88 × 32 cm', pimg:'torana',    image:IMG+'torana.png',    badge:null,         meta:'Holden · Spotted Gum mount',            desc:'Jamaica-lime Torana SLR 5000 in its classic muscle-era livery. ' + STD_DESC },
  { id:'p-fastback', name:'1967 Mustang Fastback',cat:'cars',      price:660, size:'88 × 32 cm', pimg:'fastback',                            badge:null,         meta:'American classic · Blackwood mount',    desc:'Iconic fastback silhouette with GT stripes. ' + STD_DESC },
  { id:'p-xygt',     name:'XY Falcon GT',         cat:'cars',      price:640, size:'88 × 32 cm', pimg:'xygt',      image:IMG+'xygt.png',      badge:null,         meta:'Ford Oz · Spotted Gum mount',           desc:'Vermillion XY Falcon GT — legendary Bathurst pedigree. ' + STD_DESC },

  /* ------- ANIMALS ------- */
  { id:'p-frenchie', name:'French Bulldog Puppy', cat:'animals',   price:425, size:'54 × 72 cm', pimg:'frenchie',  image:IMG+'frenchie.png',  badge:'Bestseller', meta:'Pet portrait · Spotted Gum mount',      desc:'Cream Frenchie puppy, wide-eyed and upright. ' + STD_DESC },
  { id:'p-heeler',   name:'Blue Heeler',          cat:'animals',   price:465, size:'60 × 74 cm', pimg:'heeler',                              badge:null,         meta:'Working dog · Ironbark mount',          desc:'The quintessential Aussie working dog, blue-merle coat and alert eyes. ' + STD_DESC },
  { id:'p-kanga',    name:'Kangaroo',             cat:'animals',   price:520, size:'80 × 96 cm', pimg:'kanga',                               badge:null,         meta:'Aussie icon · Spotted Gum mount',       desc:'Standing eastern grey — capturing the powerful hind legs and alert ears. ' + STD_DESC },
  { id:'p-koala',    name:'Koala',                cat:'animals',   price:445, size:'56 × 70 cm', pimg:'koala',                               badge:null,         meta:'Marsupial · Blackwood mount',           desc:'Classic tree-cuddle koala pose, silver-grey fur detail. ' + STD_DESC },
  { id:'p-dingo',    name:'Dingo',                cat:'animals',   price:495, size:'72 × 54 cm', pimg:'dingo',                               badge:null,         meta:'Wild dog · Ironbark mount',             desc:'Golden-coated dingo in a watchful side profile. ' + STD_DESC },
  { id:'p-turtle',   name:'Green Sea Turtle',     cat:'animals',   price:550, size:'72 × 56 cm', pimg:'turtle',    image:IMG+'bonus-sea-turtle.png', badge:'New',  meta:'Reef dweller · Silky Oak mount',        desc:'Green sea turtle in full glide — translucent fins, patterned shell. ' + STD_DESC },
  { id:'p-ulysses',  name:'Ulysses Butterfly',    cat:'animals',   price:305, size:'40 × 38 cm', pimg:'ulysses',   image:IMG+'bonus-ulysses-butterfly.png', badge:'New', meta:'Tropical Queensland · Silky Oak mount', desc:'Electric-blue Ulysses butterfly — a Far North Queensland icon. ' + STD_DESC },

  /* ------- BIRDS ------- */
  { id:'p-lorikeet', name:'Rainbow Lorikeet',     cat:'birds',     price:385, size:'50 × 60 cm', pimg:'lorikeet',  image:IMG+'lorikeet.png',  badge:'Popular',    meta:'Aussie parrot · Silky Oak mount',       desc:'Electric rainbow plumage against a mid-flight pose. ' + STD_DESC },
  { id:'p-kooka',    name:'Kookaburra',           cat:'birds',     price:395, size:'54 × 60 cm', pimg:'kooka',                               badge:null,         meta:'Laughing bird · Spotted Gum mount',     desc:'Classic laughing kookaburra perched with its signature blue wing flash. ' + STD_DESC },
  { id:'p-cocky',    name:'Sulphur-Crested Cockatoo', cat:'birds', price:420, size:'58 × 68 cm', pimg:'cocky',                               badge:null,         meta:'Parrot · Blackwood mount',              desc:'Cheeky cockatoo with crest raised — white body, sulphur-yellow crest. ' + STD_DESC },
  { id:'p-eagle',    name:'Wedge-Tailed Eagle',   cat:'birds',     price:620, size:'110 × 74 cm',pimg:'eagle',                               badge:'Signature',  meta:'Raptor · Ironbark mount',               desc:'Full wingspan wedge-tailed eagle — serious size, serious presence. ' + STD_DESC },
  { id:'p-galah',    name:'Galah',                cat:'birds',     price:375, size:'50 × 56 cm', pimg:'galah',                               badge:null,         meta:'Pink parrot · Silky Oak mount',         desc:'Soft pink and grey galah — always a favourite. ' + STD_DESC },
];

const CAT_LABELS = {
  'saltwater':  'Saltwater Fish',
  'freshwater': 'Freshwater Fish',
  'cars':       'Cars',
  'animals':    'Animals',
  'birds':      'Birds',
};

const CAT_IMAGES = {
  'saltwater':  'assets/images/cat-saltwater.jpg',
  'freshwater': 'assets/images/cat-freshwater.webp',
  'cars':       'assets/images/cat-cars.jpg',
  'birds':      'assets/images/cat-birds.jpg',
  // animals intentionally omitted — falls back to gradient
};

/* ---------- RENDER PRODUCTS ---------- */
const grid = document.getElementById('productGrid'); // null on homepage — only present on category pages
function shortName(n){
  const parts = n.replace(/·/g,'').split(/\s+/).filter(Boolean);
  return parts.slice(0, 3).join(' ');
}

const SHOWCASE = [
  { cat: 'saltwater',  num: '01', title: 'Saltwater Fish',  tagline: 'From the reef to your wall.',          feature: 'p-coral',    noun: 'species', hero: true },
  { cat: 'freshwater', num: '02', title: 'Freshwater Fish', tagline: 'River kings, immortalised in resin.',  feature: 'p-cod',      noun: 'species' },
  { cat: 'cars',       num: '03', title: 'Cars',            tagline: 'Bathurst legends, sealed under glass.',feature: 'p-monaro',   noun: 'classics' },
  { cat: 'animals',    num: '04', title: 'Animals & Pets',  tagline: 'Working dogs, wildlife, family.',      feature: 'p-frenchie', noun: 'portraits' },
  { cat: 'birds',      num: '05', title: 'Birds',           tagline: 'Aussie skies, frozen mid-flight.',     feature: 'p-lorikeet', noun: 'species' },
];

function renderCategoryShowcase(){
  const showcase = document.getElementById('catShowcase');
  if (!showcase) return;
  showcase.innerHTML = SHOWCASE.map(c => {
    const p = PRODUCTS.find(x => x.id === c.feature);
    const count = PRODUCTS.filter(x => x.cat === c.cat).length;
    const cutout = p?.image
      ? `<img src="${p.image}" class="cat-show-cutout" alt="" loading="lazy"/>`
      : `<div class="cat-show-placeholder">${shortName(p?.name || c.title)}</div>`;
    return `
      <a class="cat-show-card stage-${c.cat}${c.hero ? ' is-hero' : ''}" href="shop.html#${c.cat}" data-cat="${c.cat}">
        <div class="cat-show-bg" aria-hidden="true"></div>
        <div class="cat-show-cutouts">${cutout}</div>
        <div class="cat-show-meta">
          <span class="cat-show-num">${c.num}</span>
          <h3 class="cat-show-title">${c.title}</h3>
          <p class="cat-show-line">${c.tagline}</p>
          <div class="cat-show-foot">
            <span class="cat-show-count"><strong>${count}</strong> ${c.noun}</span>
            <span class="cat-show-cta">Browse <span class="arrow" aria-hidden="true">→</span></span>
          </div>
        </div>
      </a>`;
  }).join('');
}

function cardHTML(p){
  // Transparent PNG cutout floats on a category-themed stage.
  // Products without a dedicated image still get the themed stage
  // with a scripted placeholder so the grid stays visually consistent.
  const stage = p.image
    ? `<div class="product-stage stage-${p.cat}">
         <img src="${p.image}" alt="${p.name}" class="product-cutout" loading="lazy"/>
       </div>`
    : `<div class="product-stage stage-${p.cat}">
         <div class="product-placeholder" aria-hidden="true">
           <span class="ph-mark">${shortName(p.name)}</span>
           <span class="ph-sub">Photo coming soon</span>
         </div>
       </div>`;
  const heartActive = (typeof isWishlisted === 'function' && isWishlisted(p.id)) ? ' is-wishlisted' : '';
  return `
    <article class="product-card" data-cat="${p.cat}" data-id="${p.id}">
      ${p.badge ? `<span class="product-badge">${p.badge}</span>` : ''}
      <button class="product-heart${heartActive}" data-wishlist-toggle="${p.id}" aria-label="Save to wishlist" type="button">
        <svg viewBox="0 0 24 24" width="18" height="18"><path d="M12 21s-7-4.5-7-10a4 4 0 0 1 7-2.65A4 4 0 0 1 19 11c0 5.5-7 10-7 10z" fill="currentColor" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>
      </button>
      <div class="product-img">
        ${stage}
        <div class="product-overlay">
          <button class="quick-view-btn" data-view="${p.id}" type="button">Quick view</button>
        </div>
      </div>
      <div class="product-body">
        <span class="product-cat">${CAT_LABELS[p.cat] || p.cat}</span>
        <h3 class="product-name">${p.name}</h3>
        <span class="product-meta">${p.size} · ${p.meta}</span>
        <div class="product-foot">
          <span class="product-price">$${p.price.toLocaleString()}</span>
          <button class="add-btn" data-add="${p.id}">Add</button>
        </div>
      </div>
    </article>`;
}

function bindCardInteractions(){
  grid.querySelectorAll('[data-add]').forEach(btn=>{
    btn.addEventListener('click', (e)=>{
      e.stopPropagation();
      const p = PRODUCTS.find(x=>x.id===btn.dataset.add);
      addToCart(p);
    });
  });
  grid.querySelectorAll('[data-view]').forEach(btn=>{
    btn.addEventListener('click', (e)=>{
      e.stopPropagation();
      openQuickView(btn.dataset.view);
    });
  });
  grid.querySelectorAll('[data-wishlist-toggle]').forEach(btn=>{
    btn.addEventListener('click', (e)=>{
      e.stopPropagation();
      e.preventDefault();
      toggleWishlist(btn.dataset.wishlistToggle);
    });
  });
  grid.querySelectorAll('.product-card').forEach(card=>{
    // Card-level click → full product page (Quick View button stays as lightbox)
    card.addEventListener('click', (e)=>{
      if (e.target.closest('[data-add]') || e.target.closest('[data-view]') || e.target.closest('[data-wishlist-toggle]')) return;
      location.href = `product.html?id=${card.dataset.id}`;
    });
    bindTilt(card);
  });
}

const prefersReducedMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function renderGrid(catOrList='all', { flip = false } = {}){
  if (!grid) return; // homepage no longer has a product grid; only category pages do
  // Accept either a category string OR a pre-filtered list (used by the
  // advanced filter panel on shop.html). Keeps catTabs handler unchanged.
  const list = Array.isArray(catOrList)
    ? catOrList
    : (catOrList === 'all' ? PRODUCTS : PRODUCTS.filter(p => p.cat === catOrList));

  // First render, no animation requested, or reduced motion → simple stagger reveal
  if (!flip || !grid.children.length || prefersReducedMotion()) {
    grid.innerHTML = list.map(cardHTML).join('');
    bindCardInteractions();
    requestAnimationFrame(()=>{
      grid.querySelectorAll('.product-card').forEach((el, i)=>{
        el.style.setProperty('--stagger', (i * 40) + 'ms');
        el.classList.add('is-in');
      });
    });
    return;
  }

  // FLIP transition for filter swaps
  // 1. FIRST — snapshot existing card positions by id
  const oldRects = new Map();
  grid.querySelectorAll('.product-card').forEach(card => {
    oldRects.set(card.dataset.id, card.getBoundingClientRect());
  });

  // 2. LAST — rebuild DOM, then measure new positions
  grid.innerHTML = list.map(cardHTML).join('');
  bindCardInteractions();
  const cards = [...grid.querySelectorAll('.product-card')];

  // 3. INVERT — paint each card at its old spot (or off-stage if newly added)
  cards.forEach(card => {
    card.classList.add('is-in'); // skip the default stagger reveal — FLIP owns motion now
    const id = card.dataset.id;
    const newRect = card.getBoundingClientRect();
    const oldRect = oldRects.get(id);
    card.style.transition = 'none';
    card.style.transformOrigin = '0 0';
    if (oldRect) {
      const dx = oldRect.left - newRect.left;
      const dy = oldRect.top  - newRect.top;
      const sx = oldRect.width  / newRect.width;
      const sy = oldRect.height / newRect.height;
      card.style.transform = `translate3d(${dx}px, ${dy}px, 0) scale(${sx}, ${sy})`;
      card.style.opacity = '1';
    } else {
      // Newcomer — drop in from below with a soft scale
      card.style.transform = 'translate3d(0, 28px, 0) scale(0.94)';
      card.style.opacity = '0';
    }
  });

  // 4. PLAY — release back to natural position next frame
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      cards.forEach((card, i) => {
        const wasOld = oldRects.has(card.dataset.id);
        const delay = wasOld ? 0 : 80 + i * 28;
        card.style.transition =
          `transform 560ms cubic-bezier(.22,.61,.36,1) ${delay}ms,` +
          `opacity 420ms ease-out ${delay}ms`;
        card.style.transform = '';
        card.style.opacity = '';
      });
    });
  });

  // Cleanup inline styles after the animation settles so hover/tilt take over cleanly
  setTimeout(() => {
    cards.forEach(card => {
      card.style.transition = '';
      card.style.transformOrigin = '';
      card.style.transform = '';
      card.style.opacity = '';
    });
  }, 1200);
}
renderGrid();
renderCategoryShowcase();

/* ---------- 3D TILT ---------- */
function bindTilt(card){
  const img = card.querySelector('.product-img');
  if(!img) return;
  let rect;
  function onMove(e){
    rect = rect || img.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width  - .5;
    const y = (e.clientY - rect.top)  / rect.height - .5;
    card.style.setProperty('--tx', `${(-y * 6).toFixed(2)}deg`);
    card.style.setProperty('--ty', `${( x * 8).toFixed(2)}deg`);
    card.style.setProperty('--gx', `${((x + .5) * 100).toFixed(1)}%`);
    card.style.setProperty('--gy', `${((y + .5) * 100).toFixed(1)}%`);
  }
  function onLeave(){
    rect = null;
    card.style.setProperty('--tx', '0deg');
    card.style.setProperty('--ty', '0deg');
  }
  card.addEventListener('mousemove', onMove);
  card.addEventListener('mouseleave', onLeave);
}

/* ---------- QUICK VIEW LIGHTBOX ---------- */
const lightbox = document.getElementById('lightbox');
const lightboxBody = document.getElementById('lightboxBody');
function openQuickView(id){
  const p = PRODUCTS.find(x=>x.id===id);
  if(!p) return;
  const stageHTML = p.image
    ? `<div class="lb-stage stage-${p.cat}"><img src="${p.image}" alt="${p.name}"/></div>`
    : `<div class="lb-stage stage-${p.cat}"><div class="pimg ${p.pimg}">${shortName(p.name)}</div></div>`;
  lightboxBody.innerHTML = `
    ${stageHTML}
    <div class="lb-info">
      <span class="lb-eyebrow">${CAT_LABELS[p.cat]}</span>
      <h3>${p.name}</h3>
      <p class="lb-meta">${p.size} · ${p.meta}</p>
      <p class="lb-desc">${p.desc}</p>
      <div class="lb-cta-row">
        <span class="lb-price">$${p.price.toLocaleString()}</span>
        <button class="btn btn-primary" data-lb-add="${p.id}">Add to cart</button>
      </div>
      <ul class="lb-pills">
        <li>Archival ink · 100+ year colour</li>
        <li>Australian hardwood backing</li>
        <li>Jewellery-grade resin finish</li>
        <li>Signed &amp; numbered</li>
      </ul>
    </div>`;
  lightbox.classList.add('is-open');
  scrim.classList.add('is-open');
  lightbox.setAttribute('aria-hidden','false');
  lightboxBody.querySelector('[data-lb-add]').addEventListener('click', ()=>{
    addToCart(p);
    closeLightbox();
  });
}
function closeLightbox(){
  lightbox.classList.remove('is-open');
  if(!cart.classList.contains('is-open')) scrim.classList.remove('is-open');
  lightbox.setAttribute('aria-hidden','true');
}
document.getElementById('lightboxClose')?.addEventListener('click', closeLightbox);

/* ---------- CATEGORY TABS (only on category pages) ---------- */
(() => {
  const tabs = document.getElementById('catTabs');
  if (!tabs) return;

  const validCats = ['all','saltwater','freshwater','cars','animals','birds'];

  // Initial filter from URL: prefer ?cat= (search-result navigation),
  // fall back to #hash (showcase-card deep links)
  const params = new URLSearchParams(location.search);
  const queryCat = (params.get('cat') || '').toLowerCase();
  const hashCat  = (location.hash || '').replace(/^#/, '').toLowerCase();
  const initialCat = validCats.includes(queryCat) ? queryCat
                   : validCats.includes(hashCat) ? hashCat
                   : 'all';
  if (initialCat !== 'all'){
    const target = tabs.querySelector(`[data-cat="${initialCat}"]`);
    if (target){
      tabs.querySelectorAll('.cat-tab').forEach(x => x.classList.remove('is-active'));
      target.classList.add('is-active');
      renderGrid(initialCat, { flip: false });
    }
  }

  // ?p=<productId> → scroll to + pulse-highlight that card after the
  // grid renders (used by the search overlay to deep-link to a product)
  const highlightId = params.get('p');
  if (highlightId){
    requestAnimationFrame(() => {
      const card = grid?.querySelector(`.product-card[data-id="${highlightId}"]`);
      if (!card) return;
      card.scrollIntoView({ behavior: 'smooth', block: 'center' });
      card.classList.add('is-highlight');
      setTimeout(() => card.classList.remove('is-highlight'), 2400);
    });
  }

  tabs.addEventListener('click', e=>{
    const t = e.target.closest('.cat-tab'); if(!t) return;
    if (t.classList.contains('is-active')) return;
    document.querySelectorAll('.cat-tab').forEach(x=>x.classList.remove('is-active'));
    t.classList.add('is-active');
    // If the advanced filter panel is wired, let it own re-rendering so
    // active filters (price/size/sort) survive a category change.
    if (window.__cbApplyShopFilters){
      window.__cbApplyShopFilters({ flip: true });
    } else {
      renderGrid(t.dataset.cat, { flip: true });
    }
    // Reflect filter in the URL so it can be linked / refreshed
    if (t.dataset.cat === 'all') {
      history.replaceState(null, '', location.pathname);
    } else {
      history.replaceState(null, '', '#' + t.dataset.cat);
    }
  });
})();

/* ---------- ADVANCED SHOP FILTERS (shop.html) ---------- */
(() => {
  const panel = document.getElementById('shopFilterPanel');
  const filterBtn = document.getElementById('shopFilterBtn');
  if (!panel || !filterBtn) return;

  const filterCount  = document.getElementById('shopFilterCount');
  const filterClear  = document.getElementById('shopFilterClear');
  const filterResult = document.getElementById('shopFilterResult');
  const sortSel      = document.getElementById('shopSort');
  const inStockEl    = document.getElementById('shopFilterInStock');

  const state = { price: '', size: '', sort: 'featured', inStock: true };

  function getSizeBucket(p){
    const m = (p.size || '').match(/(\d+)\s*[×x]\s*(\d+)/);
    if (!m) return null;
    const max = Math.max(+m[1], +m[2]);
    if (max < 50) return 'small';
    if (max < 80) return 'medium';
    if (max < 100) return 'large';
    return 'xl';
  }
  function getMaxDim(p){
    const m = (p.size || '').match(/(\d+)\s*[×x]\s*(\d+)/);
    return m ? Math.max(+m[1], +m[2]) : 0;
  }
  function getActiveCat(){
    return document.querySelector('#catTabs .cat-tab.is-active')?.dataset.cat || 'all';
  }

  function buildList(){
    const cat = getActiveCat();
    let list = cat === 'all' ? PRODUCTS.slice() : PRODUCTS.filter(p => p.cat === cat);
    if (state.price){
      const [lo, hi] = state.price.split('-').map(Number);
      list = list.filter(p => p.price >= lo && p.price <= hi);
    }
    if (state.size){
      list = list.filter(p => getSizeBucket(p) === state.size);
    }
    // inStock toggle is mockup-only — every product is in stock today
    if (state.sort === 'price-asc')  list.sort((a,b) => a.price - b.price);
    if (state.sort === 'price-desc') list.sort((a,b) => b.price - a.price);
    if (state.sort === 'size-desc')  list.sort((a,b) => getMaxDim(b) - getMaxDim(a));
    if (state.sort === 'size-asc')   list.sort((a,b) => getMaxDim(a) - getMaxDim(b));
    return list;
  }

  function activeFilterCount(){
    let n = 0;
    if (state.price) n++;
    if (state.size)  n++;
    if (state.sort && state.sort !== 'featured') n++;
    return n;
  }

  function applyFilters(opts = {}){
    const list = buildList();
    renderGrid(list, { flip: opts.flip ?? false });
    const total = list.length;
    if (filterResult){
      filterResult.textContent = total === 1 ? '1 piece' : `${total} pieces`;
    }
    const n = activeFilterCount();
    if (n > 0){
      filterCount.hidden = false;
      filterCount.textContent = n;
    } else {
      filterCount.hidden = true;
    }
  }

  // Wire the pill groups (price + size)
  panel.querySelectorAll('.shop-filter-pills').forEach(group => {
    const key = group.dataset.filter;
    group.addEventListener('click', e => {
      const pill = e.target.closest('.shop-filter-pill');
      if (!pill) return;
      group.querySelectorAll('.shop-filter-pill').forEach(p => p.classList.remove('is-active'));
      pill.classList.add('is-active');
      state[key] = pill.dataset.val;
      applyFilters({ flip: true });
    });
  });

  // Sort dropdown
  sortSel?.addEventListener('change', () => {
    state.sort = sortSel.value;
    applyFilters({ flip: true });
  });

  // In-stock toggle (visual only for now)
  inStockEl?.addEventListener('change', () => {
    state.inStock = inStockEl.checked;
    applyFilters({ flip: true });
  });

  // Clear all
  filterClear?.addEventListener('click', () => {
    state.price = ''; state.size = ''; state.sort = 'featured';
    panel.querySelectorAll('.shop-filter-pills').forEach(group => {
      group.querySelectorAll('.shop-filter-pill').forEach((p, i) => {
        p.classList.toggle('is-active', i === 0);
      });
    });
    if (sortSel) sortSel.value = 'featured';
    applyFilters({ flip: true });
  });

  // Toggle the panel open/closed
  filterBtn.addEventListener('click', () => {
    const open = panel.classList.toggle('is-open');
    filterBtn.classList.toggle('is-open', open);
    filterBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
  });

  // Expose hook so catTabs handler re-runs through us on category change
  window.__cbApplyShopFilters = applyFilters;

  // Initial render — surfaces the result count & re-applies any URL-based cat
  applyFilters();
})();

/* ---------- SEARCH OVERLAY (any page) ---------- */
(() => {
  const overlay = document.getElementById('searchOverlay');
  if (!overlay) return;
  const btn      = document.getElementById('searchBtn');
  const input    = document.getElementById('searchInput');
  const results  = document.getElementById('searchResults');
  const closeBtn = document.getElementById('searchClose');
  if (!btn || !input || !results || !closeBtn) return;

  const HINT_HTML = `<p class="search-hint">Try <button class="search-chip" data-q="barra">barra</button> · <button class="search-chip" data-q="monaro">monaro</button> · <button class="search-chip" data-q="lorikeet">lorikeet</button> · <button class="search-chip" data-q="reef">reef</button></p>`;

  const escapeHtml = (s) => s.replace(/[<>&"']/g, c => (
    {'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&#39;'}[c]
  ));

  function open(){
    overlay.hidden = false;
    requestAnimationFrame(() => {
      overlay.classList.add('is-open');
      input.focus();
      input.select();
    });
  }
  function close(){
    overlay.classList.remove('is-open');
    setTimeout(() => {
      overlay.hidden = true;
      input.value = '';
      results.innerHTML = HINT_HTML;
      bindChips();
    }, 220);
  }

  function render(q){
    const query = q.trim().toLowerCase();
    if (!query){ results.innerHTML = HINT_HTML; bindChips(); return; }
    const matches = PRODUCTS.filter(p => {
      const hay = (p.name + ' ' + (p.meta || '') + ' ' + (CAT_LABELS[p.cat] || '')).toLowerCase();
      return hay.includes(query);
    }).slice(0, 8);
    if (!matches.length){
      results.innerHTML = `
        <p class="search-empty">
          No matches for <em>"${escapeHtml(q)}"</em>.<br/>
          <a href="index.html#custom">Get one made →</a>
        </p>`;
      return;
    }
    results.innerHTML = matches.map(p => `
      <a class="search-result" href="product.html?id=${p.id}">
        <div class="search-result-thumb stage-${p.cat}">
          ${p.image
            ? `<img src="${p.image}" alt="" loading="lazy"/>`
            : `<span class="search-result-mark">${shortName(p.name)}</span>`}
        </div>
        <div class="search-result-meta">
          <span class="search-result-cat">${CAT_LABELS[p.cat]}</span>
          <strong>${p.name}</strong>
          <span class="search-result-sub">${p.size} · $${p.price.toLocaleString()}</span>
        </div>
        <span class="search-result-go" aria-hidden="true">→</span>
      </a>
    `).join('');
  }

  function bindChips(){
    results.querySelectorAll('.search-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        input.value = chip.dataset.q;
        render(input.value);
      });
    });
  }
  bindChips();

  btn.addEventListener('click', open);
  closeBtn.addEventListener('click', close);
  overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
  input.addEventListener('input', () => render(input.value));

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !overlay.hidden) close();
    // "/" shortcut from anywhere except form fields
    if (e.key === '/' && overlay.hidden){
      const tag = (document.activeElement?.tagName || '').toLowerCase();
      if (tag !== 'input' && tag !== 'textarea' && tag !== 'select') {
        e.preventDefault();
        open();
      }
    }
  });
})();

/* ---------- CART ---------- */
const cartBtn   = document.getElementById('cartBtn');
const cart      = document.getElementById('cartDrawer');
const cartClose = document.getElementById('cartClose');
const scrim     = document.getElementById('scrim');
const cartBody  = document.getElementById('cartBody');
const cartFoot  = document.getElementById('cartFoot');
const cartCount = document.getElementById('cartCount');
const cartTotal = document.getElementById('cartTotal');

let items = [];
try { items = JSON.parse(localStorage.getItem('cbwm_cart') || '[]'); } catch(_) {}

function saveCart(){ localStorage.setItem('cbwm_cart', JSON.stringify(items)); renderCart(); }
function openCart(){ if (!cart) return; cart.classList.add('is-open'); scrim?.classList.add('is-open'); cart.setAttribute('aria-hidden','false'); }
function closeCart(){ if (!cart) return; cart.classList.remove('is-open'); scrim?.classList.remove('is-open'); cart.setAttribute('aria-hidden','true'); }
cartBtn?.addEventListener('click', openCart);
cartClose?.addEventListener('click', closeCart);
scrim?.addEventListener('click', closeCart);

function addToCart(p){
  const found = items.find(i=>i.id===p.id);
  if(found) found.qty++;
  else items.push({ id:p.id, name:p.name, price:p.price, pimg:p.pimg, qty:1 });
  saveCart();
  toast(`Added: ${p.name}`);
  openCart();
}
function removeFromCart(id){ items = items.filter(i=>i.id!==id); saveCart(); }
function renderCart(){
  if (!cartCount || !cartBody || !cartFoot) return; // page has no cart UI (e.g. about.html)
  cartCount.textContent = items.reduce((s,i)=>s+i.qty, 0);
  if(!items.length){
    cartBody.innerHTML = `<p class="cart-empty">Your cart's empty.<br/>Have a browse of <a href="shop.html">the collection →</a></p>`;
    cartFoot.hidden = true;
    return;
  }
  cartBody.innerHTML = items.map(i=>`
    <div class="cart-item">
      <div class="pimg ${i.pimg} cart-item-img">${shortName(i.name)}</div>
      <div>
        <div class="cart-item-name">${i.name}</div>
        <div class="cart-item-meta">Qty ${i.qty}</div>
        <a class="cart-item-remove" data-rm="${i.id}">Remove</a>
      </div>
      <div class="cart-item-price">$${(i.price*i.qty).toLocaleString()}</div>
    </div>
  `).join('');
  cartBody.querySelectorAll('[data-rm]').forEach(a=>a.addEventListener('click', ()=>removeFromCart(a.dataset.rm)));
  cartFoot.hidden = false;
  cartTotal.textContent = '$' + items.reduce((s,i)=>s+i.price*i.qty, 0).toLocaleString();
}
renderCart();

/* ---------- WISHLIST ---------- */
const wishlistBtn    = document.getElementById('wishlistBtn');
const wishlistDrawer = document.getElementById('wishlistDrawer');
const wishlistClose  = document.getElementById('wishlistClose');
const wishlistBody   = document.getElementById('wishlistBody');
const wishlistCount  = document.getElementById('wishlistCount');

let wishlist = [];
try { wishlist = JSON.parse(localStorage.getItem('cbwm_wishlist') || '[]'); } catch(_) {}

function isWishlisted(id){ return wishlist.includes(id); }
function saveWishlist(){
  localStorage.setItem('cbwm_wishlist', JSON.stringify(wishlist));
  renderWishlist();
  // Sync heart UI on every visible toggle button
  document.querySelectorAll('[data-wishlist-toggle]').forEach(btn => {
    btn.classList.toggle('is-wishlisted', isWishlisted(btn.dataset.wishlistToggle));
  });
}
function addToWishlist(id){
  if (!wishlist.includes(id)) wishlist.push(id);
  saveWishlist();
  const p = PRODUCTS.find(x => x.id === id);
  if (p) toast(`Saved: ${p.name}`);
}
function removeFromWishlistById(id){
  wishlist = wishlist.filter(x => x !== id);
  saveWishlist();
}
function toggleWishlist(id){
  if (isWishlisted(id)) {
    removeFromWishlistById(id);
    const p = PRODUCTS.find(x => x.id === id);
    if (p) toast(`Removed: ${p.name}`);
  } else {
    addToWishlist(id);
  }
}
function openWishlist(){
  if (!wishlistDrawer) return;
  wishlistDrawer.classList.add('is-open');
  scrim?.classList.add('is-open');
  wishlistDrawer.setAttribute('aria-hidden','false');
}
function closeWishlist(){
  if (!wishlistDrawer) return;
  wishlistDrawer.classList.remove('is-open');
  if (!cart?.classList.contains('is-open')) scrim?.classList.remove('is-open');
  wishlistDrawer.setAttribute('aria-hidden','true');
}
function renderWishlist(){
  if (!wishlistCount || !wishlistBody) return;
  wishlistCount.textContent = wishlist.length;
  wishlistCount.hidden = wishlist.length === 0;
  if (!wishlist.length){
    wishlistBody.innerHTML = `<p class="cart-empty">Your wishlist is empty.<br/>Tap the heart on any piece to save it for later.</p>`;
    return;
  }
  wishlistBody.innerHTML = wishlist.map(id => {
    const p = PRODUCTS.find(x => x.id === id);
    if (!p) return '';
    const thumb = p.image
      ? `<img src="${p.image}" alt=""/>`
      : `<span class="wish-thumb-mark">${shortName(p.name)}</span>`;
    return `
      <div class="cart-item wish-item">
        <a class="wish-thumb stage-${p.cat}" href="product.html?id=${p.id}">${thumb}</a>
        <div class="wish-meta">
          <a class="cart-item-name" href="product.html?id=${p.id}">${p.name}</a>
          <div class="cart-item-meta">${p.size} · ${CAT_LABELS[p.cat]}</div>
          <div class="wish-actions">
            <button class="wish-add" data-wish-add="${p.id}" type="button">Add to cart</button>
            <a class="cart-item-remove" data-rm-wish="${p.id}">Remove</a>
          </div>
        </div>
        <div class="cart-item-price">$${p.price.toLocaleString()}</div>
      </div>
    `;
  }).join('');
  wishlistBody.querySelectorAll('[data-rm-wish]').forEach(a => {
    a.addEventListener('click', () => removeFromWishlistById(a.dataset.rmWish));
  });
  wishlistBody.querySelectorAll('[data-wish-add]').forEach(b => {
    b.addEventListener('click', () => {
      const p = PRODUCTS.find(x => x.id === b.dataset.wishAdd);
      if (p){
        addToCart(p);
        removeFromWishlistById(p.id);
      }
    });
  });
}
wishlistBtn?.addEventListener('click', openWishlist);
wishlistClose?.addEventListener('click', closeWishlist);
renderWishlist();

/* ---------- API ENDPOINTS ----------
 * Centralised so the backend can be wired in one place.
 * For the static mockup these all POST to a stub that resolves locally;
 * once the CF Workers / Hono backend lands these URLs become real.
 */
const API = {
  customCommission: '/api/custom',
  contact:          '/api/contact',
  newsletter:       '/api/newsletter',
  cart:             '/api/cart',
  checkout:         '/api/checkout',
  upload:           '/api/upload',
};
async function apiPost(url, payload) {
  // For mockup: simulate latency + a resolved response. Real backend swaps this body for fetch().
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (res.ok) return await res.json().catch(() => ({ ok: true }));
    throw new Error('Backend responded ' + res.status);
  } catch (err) {
    // Stubbed offline-or-no-backend fallback so the UI still works in the mockup
    await new Promise(r => setTimeout(r, 600));
    return { ok: true, stub: true, queuedAt: new Date().toISOString() };
  }
}
function serializeForm(form) {
  const data = new FormData(form);
  const out = {};
  for (const [k, v] of data.entries()) {
    if (v instanceof File) {
      // Don't try to send Files via JSON — note their names + sizes
      if (!out._files) out._files = [];
      if (v.size > 0) out._files.push({ name: v.name, size: v.size, type: v.type });
    } else {
      out[k] = v;
    }
  }
  return out;
}

/* ---------- FORMS ---------- */
/* Legacy custom form — wizard replaces it; guarded in case the markup ever returns */
document.getElementById('customForm')?.addEventListener('submit', async e => {
  e.preventDefault();
  const f = e.target;
  const missing = [];
  if (!f.name.value.trim())  missing.push('name');
  if (!f.email.value.trim()) missing.push('email');
  if (!f.subject.value)      missing.push('category');
  if (missing.length){
    toast(`Just need your ${missing.join(', ')} so Max can reply.`);
    return;
  }
  const submitBtn = f.querySelector('button[type="submit"]');
  if (submitBtn){ submitBtn.disabled = true; submitBtn.textContent = 'Sending…'; }
  const payload = serializeForm(f);
  payload._sentAt = new Date().toISOString();
  payload._aiMockupAttached = !document.getElementById('aiPreview')?.hidden;
  await apiPost(API.customCommission, payload);
  if (submitBtn){ submitBtn.disabled = false; submitBtn.textContent = 'Request a Quote'; }
  toast('Brief sent with your AI mockup — Max will reply within 1 business day.');
  f.reset();
  const ap = document.getElementById('aiPreview');
  if (ap) ap.hidden = true;
});
document.getElementById('contactForm')?.addEventListener('submit', async e => {
  e.preventDefault();
  const f = e.target;
  if (!f.name.value.trim() || !f.email.value.trim() || !f.message.value.trim()){
    toast('Add your name, email and a message and we\'ll write back.');
    return;
  }
  const submitBtn = f.querySelector('button[type="submit"]');
  if (submitBtn){ submitBtn.disabled = true; submitBtn.textContent = 'Sending…'; }
  await apiPost(API.contact, serializeForm(f));
  if (submitBtn){ submitBtn.disabled = false; submitBtn.textContent = 'Send message'; }
  toast('Message sent — cheers, Max will reply soon.');
  f.reset();
});

/* ---------- LEGACY: old custom form dropzone (removed in favour of new wizard) ----------
 * This IIFE harmlessly bails because the old #dropzone / #aiPreview elements
 * are no longer in the DOM. Kept for now in case we revert. */
(() => {
  const dz       = document.getElementById('dropzone');
  const fileIn   = document.getElementById('photosInput');
  const preview  = document.getElementById('aiPreview');
  const stage    = document.getElementById('aiPreviewStage');
  const loader   = document.getElementById('aiPreviewLoader');
  const previewImg = document.getElementById('aiPreviewImg');
  const clearBtn = document.getElementById('aiPreviewClear');
  const catSel   = document.querySelector('#customForm select[name="subject"]');
  const sizeSel  = document.querySelector('#customForm select[name="size"]');
  const hintTimber = document.getElementById('aiHintTimber');
  const hintSize   = document.getElementById('aiHintSize');
  const hintTurn   = document.getElementById('aiHintTurnaround');
  if (!dz || !fileIn || !preview) return;

  // Per-category AI "smarts" — simulated suggestions Max would actually make
  const SUGGESTIONS = {
    'Saltwater Fish':  { timber: 'Silky Oak / Ironbark',     size: '70 × 32 cm',  turnaround: '4–6 weeks' },
    'Freshwater Fish': { timber: 'Spotted Gum / River Red Gum', size: '60 × 28 cm', turnaround: '4–6 weeks' },
    'Car':             { timber: 'Blackwood',                size: '88 × 32 cm',  turnaround: '6–8 weeks' },
    'Animal / Pet':    { timber: 'Spotted Gum / Silky Oak',  size: '54 × 70 cm',  turnaround: '5–7 weeks' },
    'Bird':            { timber: 'Silky Oak',                size: '58 × 64 cm',  turnaround: '4–6 weeks' },
    'Other':           { timber: 'Refined with Max',         size: 'Custom',      turnaround: '5–8 weeks' },
    '':                { timber: 'Silky Oak / Ironbark',     size: '70 × 32 cm',  turnaround: '4–6 weeks' },
  };
  // Size dropdown can override the suggestion when user picks one explicitly
  const SIZE_OVERRIDE = {
    'Small (up to 40 cm)':       '34 × 28 cm',
    'Medium (40 – 80 cm)':       '70 × 32 cm',
    'Large (80 – 120 cm)':       '110 × 40 cm',
    'Extra large (120 cm +)':    '140 × 50 cm',
  };

  function updateSuggestions(){
    const cat = catSel?.value || '';
    const s = SUGGESTIONS[cat] || SUGGESTIONS[''];
    if (hintTimber) hintTimber.textContent = s.timber;
    if (hintTurn)   hintTurn.textContent   = s.turnaround;
    const sizeKey = sizeSel?.value || '';
    if (hintSize) hintSize.textContent = SIZE_OVERRIDE[sizeKey] || s.size;
  }

  function showPreview(file){
    if (!file || !file.type?.startsWith('image/')) {
      toast('We can preview JPG, PNG or HEIC images only.');
      return;
    }
    preview.hidden = false;
    previewImg.hidden = true;
    loader.hidden = false;
    updateSuggestions();
    // Smooth-scroll the preview into view
    requestAnimationFrame(() => {
      preview.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
    // Read file → data URL
    const reader = new FileReader();
    reader.onload = (e) => {
      previewImg.src = e.target.result;
      // Simulate AI generation latency for the cinematic feel
      setTimeout(() => {
        loader.hidden = true;
        previewImg.hidden = false;
      }, 1400 + Math.random() * 600);
    };
    reader.onerror = () => {
      loader.hidden = true;
      toast('Couldn\'t read that image — try another one.');
    };
    reader.readAsDataURL(file);
  }

  function clearPreview(){
    preview.hidden = true;
    previewImg.hidden = true;
    previewImg.src = '';
    loader.hidden = false;
    if (fileIn) fileIn.value = '';
  }

  // Drag visuals
  ['dragenter','dragover'].forEach(ev =>
    dz.addEventListener(ev, e => { e.preventDefault(); dz.classList.add('is-drag'); }));
  ['dragleave','drop'].forEach(ev =>
    dz.addEventListener(ev, e => { e.preventDefault(); dz.classList.remove('is-drag'); }));

  // Drop handler
  dz.addEventListener('drop', e => {
    const files = [...(e.dataTransfer?.files || [])];
    if (!files.length) return;
    // Sync to the file input so the form has them on submit
    try {
      const dt = new DataTransfer();
      files.forEach(f => dt.items.add(f));
      fileIn.files = dt.files;
    } catch(_) { /* HEIC types may not be addable in some browsers — preview still works */ }
    showPreview(files[0]);
    if (files.length > 1) toast(`${files.length} photos attached — previewing the first.`);
  });

  // Click-to-browse handler (the file input change)
  fileIn.addEventListener('change', () => {
    const files = [...(fileIn.files || [])];
    if (files.length) showPreview(files[0]);
  });

  // Clear preview
  clearBtn?.addEventListener('click', clearPreview);

  // Live-update suggestions as category/size dropdowns change
  catSel?.addEventListener('change', updateSuggestions);
  sizeSel?.addEventListener('change', updateSuggestions);
})();

/* ---------- TOAST ---------- */
const toastEl = document.getElementById('toast');
let toastTimer;
function toast(msg){
  toastEl.textContent = msg;
  toastEl.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(()=>toastEl.classList.remove('show'), 2400);
}

/* ---------- FOOTER YEAR ---------- */
document.getElementById('year').textContent = new Date().getFullYear();

/* ---------- ESC to close cart + lightbox ---------- */
document.addEventListener('keydown', e=>{
  if(e.key==='Escape'){
    closeCart();
    closeLightbox();
  }
});

/* ---------- SCROLL REVEAL ---------- */
(() => {
  if (!('IntersectionObserver' in window)) {
    document.querySelectorAll('.reveal').forEach(el => el.classList.add('is-in'));
    return;
  }
  const io = new IntersectionObserver((entries) => {
    entries.forEach((ent) => {
      if (ent.isIntersecting) {
        ent.target.classList.add('is-in');
        io.unobserve(ent.target);
      }
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
  document.querySelectorAll('.reveal').forEach((el) => io.observe(el));
})();

/* ---------- HERO PARALLAX ---------- */
(() => {
  const ghost = document.querySelector('.hero-hero-fish img');
  const hero  = document.querySelector('.hero');
  if (!ghost || !hero) return;
  let running = false;
  function onScroll(){
    if(running) return;
    running = true;
    requestAnimationFrame(()=>{
      const r = hero.getBoundingClientRect();
      const visible = Math.max(0, Math.min(1, 1 - r.top / window.innerHeight));
      ghost.style.transform =
        `translateY(${(visible * -40).toFixed(1)}px) rotate(${(-4 + visible * 2).toFixed(2)}deg)`;
      running = false;
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
})();

/* ---------- GALLERY (Phase D) ---------- */
(() => {
  const gal = document.getElementById('gallery');
  if (!gal) return;
  // Pick 12 products with real images, prioritise a nice visual mix
  const pool = PRODUCTS.filter(p => p.image);
  const featured = [
    'p-coral','p-mahi','p-snapper','p-barra','p-cod',
    'p-monaro','p-torana','p-xygt',
    'p-frenchie','p-turtle','p-lorikeet','p-ulysses',
  ].map(id => pool.find(p => p.id === id)).filter(Boolean);
  gal.innerHTML = featured.map(p => `
    <div class="g-tile stage-${p.cat}" data-id="${p.id}">
      <div class="g-stage"><img src="${p.image}" alt="${p.name}" loading="lazy"/></div>
      <div class="g-overlay">
        <div class="g-caption">${p.name}<small>${CAT_LABELS[p.cat]}</small></div>
      </div>
    </div>
  `).join('');
  gal.querySelectorAll('.g-tile').forEach(t => {
    t.addEventListener('click', () => openQuickView(t.dataset.id));
  });
})();

/* ---------- STAT COUNTERS (Phase D) ---------- */
(() => {
  const stats = document.querySelectorAll('.stat strong[data-count]');
  if (!stats.length || !('IntersectionObserver' in window)) {
    stats.forEach(s => s.textContent = s.dataset.count);
    return;
  }
  const io = new IntersectionObserver((entries) => {
    entries.forEach(ent => {
      if (!ent.isIntersecting) return;
      const el = ent.target;
      const target = parseInt(el.dataset.count, 10);
      const start = performance.now();
      const dur = 1400;
      function tick(now) {
        const t = Math.min(1, (now - start) / dur);
        const eased = 1 - Math.pow(1 - t, 3);
        el.textContent = Math.round(target * eased).toLocaleString();
        if (t < 1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
      io.unobserve(el);
    });
  }, { threshold: 0.4 });
  stats.forEach(s => io.observe(s));
})();

/* ---------- CURSOR GLOW on buttons (Phase E) ---------- */
(() => {
  document.addEventListener('mousemove', (e) => {
    const btn = e.target.closest('.btn');
    if (!btn) return;
    const r = btn.getBoundingClientRect();
    btn.style.setProperty('--bx', `${((e.clientX - r.left) / r.width * 100).toFixed(1)}%`);
    btn.style.setProperty('--by', `${((e.clientY - r.top)  / r.height * 100).toFixed(1)}%`);
  });
})();

/* ======================================================
   CUSTOM ORDER WIZARD — AI-powered hero flow
   Steps: 1 Upload → 2 AI Cut-out → 3 Customise → 4 Order → 5 Success
   Backend wiring (background removal, Stripe checkout) goes through API.upload
   and API.checkout; for the static mockup we simulate both client-side.
   ====================================================== */
(() => {
  const wizard = document.getElementById('cmpWizard');
  if (!wizard) return;

  // ----- Element refs -----
  const dropzone   = document.getElementById('cmpDropzone');
  const fileInput  = document.getElementById('cmpFileInput');
  const samples    = wizard.querySelectorAll('.cmp-sample');
  const processing = document.getElementById('cmpProcessing');
  const procStep   = document.getElementById('cmpProcessingStep');
  const cutoutResult = document.getElementById('cmpCutoutResult');
  const originalImg  = document.getElementById('cmpOriginalImg');
  const cutoutImg    = document.getElementById('cmpCutoutImg');
  const step2Next  = document.getElementById('cmpStep2Next');
  const timberGrid = document.getElementById('cmpTimberGrid');
  const sizeList   = document.getElementById('cmpSizeList');
  const liveStage  = document.getElementById('cmpLiveStage');
  const liveCutout = document.getElementById('cmpLiveCutout');
  const finalStage = document.getElementById('cmpFinalStage');
  const finalCutout= document.getElementById('cmpFinalCutout');
  const previewTimber = document.getElementById('cmpPreviewTimber');
  const previewSize   = document.getElementById('cmpPreviewSize');
  const previewPrice  = document.getElementById('cmpPreviewPrice');
  const sumLabel    = document.getElementById('cmpSumLabel');
  const sumSubtotal = document.getElementById('cmpSumSubtotal');
  const sumShipping = document.getElementById('cmpSumShipping');
  const sumTotal    = document.getElementById('cmpSumTotal');
  const orderForm   = document.getElementById('cmpOrderForm');
  const submitBtn   = document.getElementById('cmpSubmitBtn');
  const orderNum    = document.getElementById('cmpOrderNum');
  const orderEmail  = document.getElementById('cmpOrderEmail');
  const startOver   = document.getElementById('cmpStartOver');

  // ----- State -----
  const state = {
    photoDataUrl: null,
    cutoutDataUrl: null,         // (in mockup, same as photoDataUrl since we have transparent PNGs)
    sourceLabel: 'Custom photo',
    timber: 'silky-oak',
    timberLabel: 'Silky Oak',
    isPremium: false,
    size: 'medium',
    sizeLabel: 'Medium',
    sizeDims: '60 × 40 cm',
    basePrice: 445,
    shipping: 25,
  };

  // ----- Step navigation -----
  function goToStep(n){
    wizard.querySelectorAll('.cmp-step').forEach(s => {
      const stepN = parseInt(s.dataset.step, 10);
      s.classList.toggle('is-current', stepN === n);
      s.classList.toggle('is-done', stepN < n);
    });
    wizard.querySelectorAll('.cmp-panel').forEach(p => {
      p.classList.toggle('is-active', parseInt(p.dataset.panel, 10) === n);
    });
    wizard.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // ----- File upload handling -----
  function handleFile(file){
    if (!file || !file.type?.startsWith('image/')){
      toast('Please pick a JPG, PNG or HEIC image.');
      return;
    }
    if (file.size > 20 * 1024 * 1024){
      toast('That file is over 20 MB — try compressing it first.');
      return;
    }
    state.sourceLabel = file.name || 'Your photo';
    const reader = new FileReader();
    reader.onload = (e) => {
      state.photoDataUrl = e.target.result;
      runAIPipeline();
    };
    reader.readAsDataURL(file);
  }

  function handleSampleSrc(src, label){
    state.sourceLabel = label || 'Sample photo';
    // Fetch the sample and convert to data URL
    fetch(src)
      .then(r => r.blob())
      .then(blob => new Promise(res => {
        const reader = new FileReader();
        reader.onload = e => res(e.target.result);
        reader.readAsDataURL(blob);
      }))
      .then(dataUrl => {
        state.photoDataUrl = dataUrl;
        runAIPipeline();
      });
  }

  /**
   * Background-removal pipeline.
   * - Production: POST the file to API.upload, the worker pipes it to a removal
   *   service (rembg / Cloudflare AI / Replicate / custom Python), returns a
   *   transparent PNG URL.
   * - Mockup: simulate the API with progressive status messages and use the
   *   uploaded image as-is (sample images are already transparent PNGs; user
   *   uploads will look "cut out" because the wood frame masks them).
   */
  /**
   * Client-side white-background removal (used as fallback when the
   * backend AI service isn't reachable — e.g. static-mockup mode).
   * Flood-fills from the image edges, marking connected near-white
   * pixels as transparent, then softens anti-aliased borders.
   * White spots INSIDE the subject (highlights, reflections) are
   * preserved because the fill is bounded by the subject's silhouette.
   */
  function removeWhiteBackgroundClient(dataUrl){
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        try {
          const MAX = 1400;
          const scale = Math.min(1, MAX / Math.max(img.naturalWidth, img.naturalHeight));
          const w = Math.round(img.naturalWidth * scale);
          const h = Math.round(img.naturalHeight * scale);
          const canvas = document.createElement('canvas');
          canvas.width = w; canvas.height = h;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, w, h);

          const id = ctx.getImageData(0, 0, w, h);
          const d = id.data;
          const w4 = w * 4;

          // "near-white" test: bright + low channel spread (= neutral / not coloured)
          const isNearWhite = (i) => {
            const r = d[i], g = d[i+1], b = d[i+2];
            const max = Math.max(r,g,b), min = Math.min(r,g,b);
            return min > 228 && (max - min) < 22;
          };

          // Flood fill from all 4 edges
          const visited = new Uint8Array(w * h);
          const stack = [];
          for (let x = 0; x < w; x++){ stack.push(x); stack.push((h-1)*w + x); }
          for (let y = 0; y < h; y++){ stack.push(y*w); stack.push(y*w + (w-1)); }

          while (stack.length){
            const p = stack.pop();
            if (visited[p]) continue;
            visited[p] = 1;
            const i = p * 4;
            if (!isNearWhite(i)) continue;
            d[i+3] = 0;
            const x = p % w, y = (p / w) | 0;
            if (x > 0)     stack.push(p - 1);
            if (x < w - 1) stack.push(p + 1);
            if (y > 0)     stack.push(p - w);
            if (y < h - 1) stack.push(p + w);
          }

          // Edge softening: anti-alias the cut by easing alpha on near-white
          // pixels that border a transparent neighbour
          for (let y = 1; y < h - 1; y++){
            for (let x = 1; x < w - 1; x++){
              const i = (y * w + x) * 4;
              if (d[i+3] === 0) continue;
              const tNeigh = (d[i-4+3] === 0) || (d[i+4+3] === 0)
                           || (d[i-w4+3] === 0) || (d[i+w4+3] === 0);
              if (!tNeigh) continue;
              const r = d[i], g = d[i+1], b = d[i+2];
              const min = Math.min(r,g,b);
              if (min > 210){
                const t = Math.min(1, (min - 210) / 35);
                d[i+3] = Math.round(255 * (1 - t * 0.9));
              }
            }
          }

          ctx.putImageData(id, 0, 0);
          resolve(canvas.toDataURL('image/png'));
        } catch (e) { reject(e); }
      };
      img.onerror = reject;
      img.src = dataUrl;
    });
  }

  async function runAIPipeline(){
    goToStep(2);
    cutoutResult.hidden = true;
    processing.hidden = false;
    step2Next.disabled = true;

    const stages = [
      'Detecting subject',
      'Removing background',
      'Cleaning edges',
      'Optimising for resin pour',
    ];
    for (let i = 0; i < stages.length; i++){
      procStep.textContent = stages[i];
      await new Promise(r => setTimeout(r, 550 + Math.random() * 350));
    }

    // Try the real backend first; fall back to client-side removal
    let resultUrl = null;
    try {
      const res = await apiPost(API.upload, { image: state.photoDataUrl, op: 'remove-bg' });
      if (res?.cutoutUrl) resultUrl = res.cutoutUrl;
    } catch(_){}

    if (!resultUrl){
      try {
        resultUrl = await removeWhiteBackgroundClient(state.photoDataUrl);
      } catch(_){
        resultUrl = state.photoDataUrl; // last-resort fallback
      }
    }

    state.cutoutDataUrl = resultUrl;
    originalImg.src = state.photoDataUrl;
    cutoutImg.src   = state.cutoutDataUrl;
    processing.hidden = true;
    cutoutResult.hidden = false;
    step2Next.disabled = false;
    // Pre-load into the live preview for step 3
    if (liveCutout)  liveCutout.src  = state.cutoutDataUrl;
    if (finalCutout) finalCutout.src = state.cutoutDataUrl;
  }

  // Drag visuals
  ['dragenter','dragover'].forEach(ev =>
    dropzone.addEventListener(ev, e => { e.preventDefault(); dropzone.classList.add('is-drag'); }));
  ['dragleave','drop'].forEach(ev =>
    dropzone.addEventListener(ev, e => { e.preventDefault(); dropzone.classList.remove('is-drag'); }));
  dropzone.addEventListener('drop', e => {
    const f = e.dataTransfer?.files?.[0];
    if (f) handleFile(f);
  });
  fileInput.addEventListener('change', () => {
    const f = fileInput.files?.[0];
    if (f) handleFile(f);
  });
  samples.forEach(s => s.addEventListener('click', () => {
    handleSampleSrc(s.dataset.sample, s.dataset.sampleLabel);
  }));

  // Step navigation buttons
  wizard.querySelectorAll('[data-cmp-back]').forEach(b =>
    b.addEventListener('click', () => {
      const cur = parseInt(wizard.querySelector('.cmp-step.is-current')?.dataset.step || '1', 10);
      goToStep(Math.max(1, cur - 1));
    })
  );
  wizard.querySelectorAll('[data-cmp-next]').forEach(b =>
    b.addEventListener('click', () => {
      const cur = parseInt(wizard.querySelector('.cmp-step.is-current')?.dataset.step || '1', 10);
      goToStep(Math.min(4, cur + 1));
    })
  );

  // ----- Step 3: Customise -----
  function recalc(){
    let price = state.basePrice;
    if (state.isPremium) price = Math.round(price * 1.15);
    const subtotal = price;
    const shipping = subtotal >= 500 ? 0 : state.shipping;
    const total = subtotal + shipping;

    if (previewTimber) previewTimber.textContent = state.timberLabel;
    if (previewSize)   previewSize.textContent   = state.sizeDims;
    if (previewPrice)  previewPrice.textContent  = '$' + total.toLocaleString();

    if (sumLabel)    sumLabel.textContent    = `${state.sizeLabel} · ${state.timberLabel}`;
    if (sumSubtotal) sumSubtotal.textContent = '$' + subtotal.toLocaleString();
    if (sumShipping) sumShipping.textContent = shipping === 0 ? 'Free' : '$' + shipping;
    if (sumTotal)    sumTotal.textContent    = '$' + total.toLocaleString();

    // Apply timber to live + final stages
    [liveStage, finalStage].forEach(s => {
      if (s) s.dataset.timber = state.timber;
    });
  }

  timberGrid?.addEventListener('click', e => {
    const btn = e.target.closest('.cmp-timber'); if (!btn) return;
    timberGrid.querySelectorAll('.cmp-timber').forEach(b => b.classList.remove('is-active'));
    btn.classList.add('is-active');
    state.timber = btn.dataset.timber;
    state.timberLabel = btn.querySelector('.cmp-timber-name').textContent;
    state.isPremium = btn.dataset.premium === '1';
    recalc();
  });
  sizeList?.addEventListener('click', e => {
    const btn = e.target.closest('.cmp-size'); if (!btn) return;
    sizeList.querySelectorAll('.cmp-size').forEach(b => b.classList.remove('is-active'));
    btn.classList.add('is-active');
    state.size = btn.dataset.size;
    state.sizeLabel = btn.querySelector('.cmp-size-meta strong').textContent;
    state.sizeDims = btn.dataset.w + ' × ' + btn.dataset.h + ' cm';
    state.basePrice = parseInt(btn.dataset.price, 10);
    recalc();
  });

  // ----- Step 4: Order submission -----
  orderForm?.addEventListener('submit', async e => {
    e.preventDefault();
    const f = e.target;
    const required = ['name','email','phone','postcode','address','suburb','state'];
    const missing = required.filter(k => !f[k]?.value.trim());
    if (missing.length){
      toast(`Please fill in: ${missing.join(', ')}`);
      const firstMissing = f[missing[0]];
      firstMissing?.focus();
      return;
    }
    submitBtn.disabled = true;
    const originalLabel = submitBtn.innerHTML;
    submitBtn.innerHTML = '<span>Processing payment…</span>';

    const orderPayload = {
      _sentAt: new Date().toISOString(),
      customer: serializeForm(f),
      piece: {
        timber: state.timber,
        timberLabel: state.timberLabel,
        size: state.size,
        sizeLabel: state.sizeLabel,
        sizeDims: state.sizeDims,
        sourceLabel: state.sourceLabel,
        basePrice: state.basePrice,
        isPremium: state.isPremium,
      },
      cutoutUrl: state.cutoutDataUrl,    // backend stores this in R2 + emails Max
      total: parseInt((sumTotal?.textContent || '$0').replace(/[^\d]/g, ''), 10) || 0,
    };

    // 1. Create the order record
    const orderRes = await apiPost(API.checkout, orderPayload);
    // 2. (Real backend would now redirect to Stripe Checkout. For mockup, simulate success.)
    await new Promise(r => setTimeout(r, 1200));

    submitBtn.disabled = false;
    submitBtn.innerHTML = originalLabel;

    // Generate friendly order number
    const orderId = 'CB-' + Date.now().toString().slice(-6);
    if (orderNum)   orderNum.textContent   = orderId;
    if (orderEmail) orderEmail.textContent = f.email.value.trim();
    goToStep(5);
  });

  startOver?.addEventListener('click', () => {
    state.photoDataUrl = null;
    state.cutoutDataUrl = null;
    if (liveCutout)  liveCutout.src  = '';
    if (finalCutout) finalCutout.src = '';
    if (originalImg) originalImg.src = '';
    if (cutoutImg)   cutoutImg.src   = '';
    orderForm?.reset();
    goToStep(1);
  });

  // Initial calc
  recalc();
})();

/* ---------- MOBILE NAV DRAWER ---------- */
(() => {
  const drawer   = document.getElementById('navDrawer');
  const backdrop = document.getElementById('navDrawerBackdrop');
  const openBtn  = document.getElementById('navMobileBtn');
  const closeBtn = document.getElementById('navDrawerClose');
  if (!drawer || !backdrop || !openBtn) return;

  function open(){
    drawer.classList.add('is-open');
    drawer.setAttribute('aria-hidden', 'false');
    backdrop.hidden = false;
    requestAnimationFrame(() => backdrop.classList.add('is-open'));
    document.documentElement.style.overflow = 'hidden';
  }
  function close(){
    drawer.classList.remove('is-open');
    drawer.setAttribute('aria-hidden', 'true');
    backdrop.classList.remove('is-open');
    setTimeout(() => { backdrop.hidden = true; }, 300);
    document.documentElement.style.overflow = '';
  }

  openBtn.addEventListener('click', open);
  closeBtn?.addEventListener('click', close);
  backdrop.addEventListener('click', close);

  // Close drawer when a nav link is clicked (so anchor jumps work)
  drawer.querySelectorAll('a').forEach(a => a.addEventListener('click', close));

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && drawer.classList.contains('is-open')) close();
  });
})();

/* ---------- CHECKOUT MODAL ---------- */
(() => {
  const modal     = document.getElementById('checkoutModal');
  const openBtn   = document.getElementById('checkoutBtn');
  if (!modal || !openBtn) return;

  const closeBtn  = document.getElementById('checkoutClose');
  const steps     = [...modal.querySelectorAll('.co-step')];
  const dots      = [...modal.querySelectorAll('.co-dot')];
  const reviewList   = document.getElementById('coReviewList');
  const reviewSub    = document.getElementById('coReviewSub');
  const reviewShip   = document.getElementById('coReviewShip');
  const reviewTotal  = document.getElementById('coReviewTotal');
  const shipTotal    = document.getElementById('coShipTotal');
  const payTotal     = document.getElementById('coPayTotal');
  const successOrder = document.getElementById('coSuccessOrder');
  const successItems = document.getElementById('coSuccessItems');
  const successEmail = document.getElementById('coSuccessEmail');

  const SHIP_FREE_THRESHOLD = 500;
  const SHIP_COST = 25;

  const subtotal = () => items.reduce((s, i) => s + i.price * i.qty, 0);
  const shipping = () => subtotal() >= SHIP_FREE_THRESHOLD ? 0 : SHIP_COST;
  const total    = () => subtotal() + shipping();

  let currentStep = 0;
  function go(stepIdx){
    currentStep = stepIdx;
    steps.forEach((s, i) => s.classList.toggle('is-current', i === stepIdx));
    dots.forEach((d, i) => {
      d.classList.toggle('is-current', i === stepIdx);
      d.classList.toggle('is-done', i < stepIdx);
    });
  }
  function open(){
    if (!items.length){ toast('Your cart is empty — add a piece first.'); return; }
    refreshReview();
    go(0);
    modal.hidden = false;
    requestAnimationFrame(() => {
      modal.classList.add('is-open');
      scrim.classList.add('is-open');
    });
  }
  function close(){
    modal.classList.remove('is-open');
    if (!cart.classList.contains('is-open')) scrim.classList.remove('is-open');
    setTimeout(() => { modal.hidden = true; }, 220);
  }
  function refreshReview(){
    if (!items.length){ close(); return; }
    reviewList.innerHTML = items.map(i => `
      <div class="co-line">
        <div class="co-line-meta">
          <strong>${i.name}</strong>
          <span>Qty ${i.qty}</span>
        </div>
        <span class="co-line-price">$${(i.price * i.qty).toLocaleString()}</span>
      </div>`).join('');
    const sub = subtotal();
    const ship = shipping();
    reviewSub.textContent   = '$' + sub.toLocaleString();
    reviewShip.textContent  = ship === 0 ? 'Free' : '$' + ship.toLocaleString();
    reviewTotal.textContent = '$' + (sub + ship).toLocaleString();
    if (shipTotal) shipTotal.textContent = '$' + (sub + ship).toLocaleString();
    if (payTotal)  payTotal.textContent  = '$' + (sub + ship).toLocaleString();
  }

  // Bind Next / Back / Pay
  modal.querySelectorAll('[data-co-next]').forEach(b => {
    b.addEventListener('click', () => {
      // Validate shipping form before advancing past step 1 (ship)
      if (currentStep === 1){
        const form = modal.querySelector('#coShipForm');
        if (!form.checkValidity()){ form.reportValidity(); return; }
      }
      // Validate payment form before processing
      if (currentStep === 2){
        const form = modal.querySelector('#coPayForm');
        if (!form.checkValidity()){ form.reportValidity(); return; }
        // Simulate processing
        const btn = b;
        const orig = btn.textContent;
        btn.disabled = true;
        btn.textContent = 'Processing payment…';
        apiPost(API.checkout, {
          items, total: total(),
          ship: serializeForm(modal.querySelector('#coShipForm')),
          payment: { last4: form.cardNumber.value.replace(/\s/g, '').slice(-4) },
        }).then(() => {
          btn.disabled = false;
          btn.textContent = orig;
          // Generate order number
          const orderId = 'CB-' + Math.floor(100000 + Math.random() * 900000);
          successOrder.textContent = orderId;
          successItems.textContent = items.reduce((s, i) => s + i.qty, 0);
          successEmail.textContent = modal.querySelector('#coShipForm input[name="email"]').value;
          // Clear cart
          items = [];
          saveCart();
          go(3);
        });
        return;
      }
      go(currentStep + 1);
    });
  });
  modal.querySelectorAll('[data-co-back]').forEach(b => {
    b.addEventListener('click', () => go(Math.max(0, currentStep - 1)));
  });

  // Card-number formatting (groups of 4)
  modal.querySelector('#coCardNum')?.addEventListener('input', (e) => {
    const v = e.target.value.replace(/\D/g, '').slice(0, 16);
    e.target.value = v.replace(/(\d{4})(?=\d)/g, '$1 ');
  });
  modal.querySelector('#coCardExp')?.addEventListener('input', (e) => {
    const v = e.target.value.replace(/\D/g, '').slice(0, 4);
    e.target.value = v.length > 2 ? v.slice(0, 2) + '/' + v.slice(2) : v;
  });
  modal.querySelector('#coCardCvc')?.addEventListener('input', (e) => {
    e.target.value = e.target.value.replace(/\D/g, '').slice(0, 4);
  });

  openBtn.addEventListener('click', () => {
    closeCart();
    open();
  });
  closeBtn.addEventListener('click', close);
  modal.addEventListener('click', e => { if (e.target === modal) close(); });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !modal.hidden && currentStep !== 3) close();
  });
})();

/* ---------- PRODUCT DETAIL PAGE (product.html) ---------- */
(() => {
  const titleEl = document.getElementById('pdpTitle');
  if (!titleEl) return;

  const params = new URLSearchParams(location.search);
  const id = params.get('id');
  const product = id ? PRODUCTS.find(p => p.id === id) : null;

  if (!product){
    const hero = document.querySelector('.pdp-hero');
    if (hero){
      hero.innerHTML = `
        <div class="pdp-404">
          <p class="eyebrow">Lost piece</p>
          <h1>Couldn't find that one.</h1>
          <p class="pdp-404-lede">Maybe it's been sold, maybe the link's gone stale. Either way — there's plenty more on the wall.</p>
          <div class="pdp-404-ctas">
            <a class="btn btn-primary" href="shop.html">Browse the collection →</a>
            <a class="btn btn-ghost" href="index.html#custom">Get one made →</a>
          </div>
        </div>`;
    }
    document.querySelector('.pdp-craft')?.remove();
    document.querySelector('.pdp-related')?.remove();
    document.querySelector('.pdp-custom-cta')?.remove();
    return;
  }

  // Document title + meta description
  document.title = `${product.name} · Crystal Brook Wall Mounts`;
  const metaDesc = document.querySelector('meta[name="description"]');
  if (metaDesc) metaDesc.setAttribute('content',
    `${product.name} — ${product.size}. ${product.desc}`);

  // Crumb
  const crumbCat = document.getElementById('pdpCrumbCat');
  if (crumbCat){
    crumbCat.textContent = CAT_LABELS[product.cat];
    crumbCat.href = `shop.html#${product.cat}`;
  }
  document.getElementById('pdpCrumbName').textContent = product.name;

  // Hero stage
  const stage = document.getElementById('pdpStage');
  stage.innerHTML = product.image
    ? `<div class="product-stage stage-${product.cat} pdp-product-stage">
         <img src="${product.image}" alt="${product.name}"/>
       </div>`
    : `<div class="product-stage stage-${product.cat} pdp-product-stage">
         <div class="product-placeholder">
           <span class="ph-mark">${shortName(product.name)}</span>
           <span class="ph-sub">Photo coming soon</span>
         </div>
       </div>`;

  // Info
  document.getElementById('pdpEyebrow').textContent = CAT_LABELS[product.cat];
  if (product.badge){
    const badge = document.getElementById('pdpBadge');
    badge.textContent = product.badge;
    badge.hidden = false;
  }
  titleEl.textContent = product.name;
  document.getElementById('pdpDesc').textContent = product.desc;
  document.getElementById('pdpSize').textContent = product.size;
  // Mount = the bit after "·" in meta (e.g. "Reef · Silky Oak mount")
  const mountText = product.meta.includes('·')
    ? product.meta.split('·').slice(1).join('·').trim()
    : product.meta;
  document.getElementById('pdpMount').textContent = mountText;
  document.getElementById('pdpPrice').textContent = '$' + product.price.toLocaleString();

  // Add to cart
  document.getElementById('pdpAdd').addEventListener('click', () => addToCart(product));

  // Heart / wishlist
  const heartBtn = document.getElementById('pdpHeart');
  if (heartBtn){
    if (isWishlisted(product.id)) heartBtn.classList.add('is-wishlisted');
    heartBtn.addEventListener('click', () => {
      toggleWishlist(product.id);
      heartBtn.classList.toggle('is-wishlisted', isWishlisted(product.id));
    });
  }

  // Related products from the same category
  const relatedGrid = document.getElementById('pdpRelatedGrid');
  if (relatedGrid){
    const related = PRODUCTS.filter(p => p.cat === product.cat && p.id !== product.id).slice(0, 4);
    if (!related.length){
      document.getElementById('pdpRelated').remove();
    } else {
      const heading = document.getElementById('pdpRelatedTitle');
      heading.textContent = `More ${CAT_LABELS[product.cat].toLowerCase()}`;
      relatedGrid.innerHTML = related.map(cardHTML).join('');
      relatedGrid.querySelectorAll('.product-card').forEach(card => {
        card.addEventListener('click', e => {
          if (e.target.closest('[data-add]') || e.target.closest('[data-view]')) return;
          location.href = `product.html?id=${card.dataset.id}`;
        });
        const addBtn = card.querySelector('[data-add]');
        addBtn?.addEventListener('click', e => {
          e.stopPropagation();
          const p = PRODUCTS.find(x => x.id === addBtn.dataset.add);
          if (p) addToCart(p);
        });
        const viewBtn = card.querySelector('[data-view]');
        viewBtn?.addEventListener('click', e => {
          e.stopPropagation();
          openQuickView(viewBtn.dataset.view);
        });
        bindTilt(card);
      });
    }
  }
})();

/* ---------- PWA: SERVICE WORKER + INSTALL PROMPT ---------- */
(() => {
  // Register the service worker
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        // Localhost preview without /sw.js root path? Try relative
        navigator.serviceWorker.register('sw.js').catch(() => {});
      });
    });
  }

  // Install prompt — use the deferred event so we can show our own UI
  const installEl    = document.getElementById('pwaInstall');
  const installBtn   = document.getElementById('pwaInstallBtn');
  const dismissBtn   = document.getElementById('pwaInstallDismiss');
  if (!installEl || !installBtn || !dismissBtn) return;

  let deferred = null;
  const STORE_KEY = 'cbwm_pwa_prompt_dismissed_at';
  const DISMISS_TTL = 1000 * 60 * 60 * 24 * 14; // 14 days

  function showInstall(){
    // Respect previous dismissal
    const last = parseInt(localStorage.getItem(STORE_KEY) || '0', 10);
    if (last && Date.now() - last < DISMISS_TTL) return;
    installEl.hidden = false;
    requestAnimationFrame(() => installEl.classList.add('is-shown'));
  }
  function hideInstall(){
    installEl.classList.remove('is-shown');
    setTimeout(() => { installEl.hidden = true; }, 600);
  }

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferred = e;
    // Hold off on the prompt for ~6s so we don't blast the user immediately
    setTimeout(showInstall, 6000);
  });

  installBtn.addEventListener('click', async () => {
    if (!deferred) {
      // iOS / browsers without the prompt — show a manual hint instead
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      toast(isIOS
        ? 'On iPhone: tap Share, then "Add to Home Screen".'
        : 'Look for "Install Crystal Brook" in your browser menu.');
      return;
    }
    hideInstall();
    deferred.prompt();
    const choice = await deferred.promptUserChoice;
    if (choice && choice.outcome === 'accepted') {
      toast('Crystal Brook installed — find us on your home screen.');
    }
    deferred = null;
  });

  dismissBtn.addEventListener('click', () => {
    localStorage.setItem(STORE_KEY, String(Date.now()));
    hideInstall();
  });

  window.addEventListener('appinstalled', () => {
    hideInstall();
    toast('Welcome aboard — Crystal Brook is on your home screen.');
  });
})();

/* ---------- CRAFT REEL MODAL (Phase C) ---------- */
(() => {
  const modal   = document.getElementById('craftReel');
  const trigger = document.getElementById('craftReelBtn');
  const closeBtn= document.getElementById('craftReelClose');
  const track   = document.getElementById('craftReelTrack');
  const bar     = document.getElementById('craftReelBar');
  if (!modal || !trigger || !track) return;

  const navBtns = [...modal.querySelectorAll('.reel-nav-btn')];
  const frames  = [...modal.querySelectorAll('.reel-frame')];
  const ctaBtns = [...modal.querySelectorAll('[data-reel-cta]')];

  function setActive(idx){
    navBtns.forEach((b, i) => b.classList.toggle('is-active', i === idx));
    frames.forEach((f, i) => f.classList.toggle('is-current', i === idx));
    if (bar) bar.style.width = (((idx + 1) / frames.length) * 100).toFixed(2) + '%';
  }

  function open(){
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('reel-open');
    // Reset scroll + activate frame 0
    track.scrollTop = 0;
    setActive(0);
    // Restart frame-0 animations (force reflow trick by toggling class)
    requestAnimationFrame(() => {
      frames[0].classList.remove('is-current');
      void frames[0].offsetWidth;
      frames[0].classList.add('is-current');
      track.focus({ preventScroll: true });
    });
  }

  function close(){
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('reel-open');
    // Stop animations by clearing is-current
    frames.forEach(f => f.classList.remove('is-current'));
    trigger.focus({ preventScroll: true });
  }

  trigger.addEventListener('click', open);
  closeBtn?.addEventListener('click', close);
  modal.addEventListener('click', (e) => {
    // Click on backdrop (the modal container itself, not its children) closes it
    if (e.target === modal) close();
  });
  document.addEventListener('keydown', (e) => {
    if (!modal.classList.contains('is-open')) return;
    if (e.key === 'Escape') { close(); return; }
    if (e.key === 'ArrowDown' || e.key === 'PageDown') {
      e.preventDefault();
      const next = Math.min(frames.length - 1, currentIndex() + 1);
      goTo(next);
    } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
      e.preventDefault();
      const prev = Math.max(0, currentIndex() - 1);
      goTo(prev);
    }
  });

  // CTA links inside the reel close the modal so the in-page anchor works
  ctaBtns.forEach(a => a.addEventListener('click', () => close()));

  navBtns.forEach((b, i) => b.addEventListener('click', () => goTo(i)));

  function currentIndex(){
    const idx = frames.findIndex(f => f.classList.contains('is-current'));
    return idx < 0 ? 0 : idx;
  }
  function goTo(idx){
    const target = frames[idx];
    if (!target) return;
    setActive(idx);
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // Track which frame is currently in view → drive nav + animations
  if ('IntersectionObserver' in window){
    const io = new IntersectionObserver((entries) => {
      // Pick the entry with the highest intersection ratio
      let best = null;
      entries.forEach(ent => {
        if (!best || ent.intersectionRatio > best.intersectionRatio) best = ent;
      });
      if (best && best.isIntersecting && best.intersectionRatio >= 0.55){
        const idx = frames.indexOf(best.target);
        if (idx >= 0) setActive(idx);
      }
    }, { root: track, threshold: [0.4, 0.55, 0.7] });
    frames.forEach(f => io.observe(f));
  }
})();
