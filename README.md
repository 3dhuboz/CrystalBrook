# Crystal Brook Wall Mounts

> Handcrafted resin-coated cut-out archival prints, mounted on Australian hardwood. Made in Gordonvale, Far North Queensland.

A bespoke storefront PWA for **Max White** of Crystal Brook Wall Mounts. Static-first mockup in this stage; the production build will be on Cloudflare Workers (Hono) + D1 + R2 + Stripe.

---

## Quick start

```bash
# From the project root
python -m http.server 8766
```

Open http://localhost:8766 in your browser. The site is plain HTML/CSS/JS — no build step.

---

## Project structure

```
.
├── index.html               # Storefront — hero, category showcase, craft, custom wizard, contact
├── about.html               # Maker's story page — Max + the workshop in Gordonvale
├── admin/
│   └── index.html           # Owner admin dashboard (stocktake, orders, custom, revenue, homepage editor)
├── assets/
│   ├── styles.css           # Storefront styles
│   ├── admin.css            # Admin styles
│   ├── app.js               # Storefront JS (wizard, gallery, cart, PWA)
│   ├── admin.js             # Admin JS (data, view switching, help drawer + tips)
│   ├── favicon.svg          # Brook Ripple brand mark
│   ├── icon-192.svg         # PWA maskable icon
│   ├── icon-512.svg         # PWA maskable icon
│   └── images/products/     # Background-removed product PNGs
├── scripts/                 # Image-processing scripts (rembg pipeline, optimisation)
├── manifest.webmanifest     # PWA manifest
└── sw.js                    # Service worker (offline shell, cache-first assets)
```

---

## Brand

- **Brand mark:** "Brook Ripple" plaque — dark stained outer frame, light pine plank, three flowing water lines representing Crystal Brook (the actual creek south of Cairns the brand is named after).
- **Typography:** Cinzel (serif display), Cormorant Garamond (serif body / italic), Inter (sans), Dancing Script (script tagline).
- **Colour palette:** warm cream `#faf6ee`, dark stained wood `#1c130a`, pine `#c89554`, gold `#d4b06a`, brook teal `#33a5c7`.

---

## What's built

### Storefront (`index.html`)
- **Hero** with the Coral Trout signature piece on a dark-frame + pine-plank stage with resin sheen
- **Five-card category showcase** (Saltwater Fish · Freshwater Fish · Cars · Animals · Birds) — hero asymmetric layout
- **The Craft section** — 4-stage process bullets, miniature Crystal Brook pieces (real cutouts on pine), Watch the Craft Reel modal trigger, Meet Max link
- **Custom Commissions Wizard** (the AI hero flow):
  - Step 1: Upload a photo (drag/drop, sample images, mobile-friendly)
  - Step 2: AI background removal + before/after preview
  - Step 3: Pick timber (Silky Oak / Spotted Gum / Blackwood / Ironbark) and size (Small → XL) with live wood-frame preview and live pricing
  - Step 4: Shipping details + Stripe checkout
  - Step 5: Order confirmation
- **Stories section** — animated stat counters, testimonials, gallery
- **Contact** with Max's real address, phone, email
- **Craft Reel modal** — scroll-snapped 4-frame walkthrough of print → cut → mount → resin
- **PWA install prompt** with friendly UI + iOS instructions

### About page (`about.html`)
- Maker's hero, origin story, place (Gordonvale + FNQ), promise, workshop visuals, contact CTA

### Admin (`admin/index.html`)
- Dashboard, Stocktake, Orders, Custom Orders kanban, Revenue, Homepage Editor, Settings
- **Help drawer** with per-view guides written in plain English (built for Max — turning 70)
- **Inline help tips** (`?` icons) on every action button, KPI card and section heading
- Keyboard shortcut: `?` opens help, `Esc` closes

### PWA
- Installable on home screen (iOS, Android, desktop)
- Offline shell + cache-first for static assets
- Three home-screen shortcuts (Shop / Custom / Admin)

---

## Real contact details

- **Workshop:** Gordonvale, FNQ — address kept off public site (visits by appointment)
- **Phone:** (07) 4056 1887
- **Email:** mandpwhite@optusnet.com.au
- **Hours:** By appointment · 7 days
- **Categories:** Saltwater Fish · Freshwater Fish · Cars · Animals · Birds

---

## What's next (production milestones)

1. **Backend** — Cloudflare Workers + Hono routing the existing `API.*` endpoints (`/api/upload`, `/api/checkout`, `/api/custom`, `/api/contact`)
2. **Background removal** — wire `/api/upload` to a real model (rembg via Workers AI or Replicate)
3. **Stripe checkout** — real `/api/checkout` → Stripe Checkout Session → webhook → order email to Max
4. **D1 schema** — products, orders, custom_orders, customers
5. **R2** — original photos + processed cutouts
6. **Admin auth** — admin-only sign-in (matches Hughesys Que pattern, no Clerk)
7. **Image asset photos from Max** — real workshop photos to replace placeholders on About page

---

## Built by

[Penny Wise I.T.](https://pennywiseit.com.au) — bespoke web apps for small Australian businesses.
