# Image Builder Worker

Powers the **Image Builder** in the Crystal Brook admin (`/admin/index.html` → sidebar → Image Builder).

Runs on Cloudflare Workers AI. Calls **FLUX 1 Schnell** to generate product photos from Max's plain-English descriptions, returns 4 variations as base64 PNGs.

---

## Deploy in 3 commands

You need a Cloudflare account (free — sign up at https://dash.cloudflare.com/sign-up if you don't have one). Workers AI free tier is **10,000 neurons / day** which is comfortably enough for hundreds of image generations.

From the **CrystalBrook repo root**:

```bash
cd workers/image-builder
npm install
npx wrangler login        # opens a browser tab — sign in, click Allow
npx wrangler deploy
```

That's it. The deploy command prints a URL like:

```
https://crystalbrook-image-builder.your-subdomain.workers.dev
```

**Copy that URL.** You'll paste it into the admin once.

---

## Wire the admin frontend (1 paste)

1. Open the admin: https://3dhuboz.github.io/CrystalBrook/admin/index.html
2. Open the browser DevTools console (F12 → Console tab)
3. Paste:

```js
localStorage.setItem('cbwm_image_builder_endpoint', 'https://crystalbrook-image-builder.your-subdomain.workers.dev/api/studio/generate');
```

(replace the URL with the one your `wrangler deploy` printed)

4. Refresh the admin. The Image Builder will now hit the real Worker. If anything goes wrong it falls back to the mockup automatically.

---

## What the endpoint does

```
POST /api/studio/generate
Content-Type: application/json
Body: { "prompt": "a barramundi leaping out of the water, isolated on white background, hyperrealistic, 8k", "count": 4 }

Response:
{
  "generations": [
    { "id": "gen-1234", "url": "data:image/png;base64,…", "prompt": "…", "model": "flux-1-schnell", "seed": 384719, "createdAt": 1714123456789 },
    ... 3 more ...
  ],
  "failures": []
}
```

Health check:
```
GET /health
→ { "ok": true, "service": "cb-image-builder-1.0", ... }
```

---

## Costs

- **FLUX 1 Schnell on Workers AI**: ~150 neurons per image
- **Free tier**: 10,000 neurons/day = ~66 images/day
- **Paid**: $0.011 per 1,000 neurons after free tier (~$0.0017/image)

Each "Generate 4 photos" click uses ~600 neurons. Even at heavy use (50 generations/day = 200 images), Max stays well inside the free tier.

---

## Local dev

```bash
npm run dev    # runs the Worker on localhost:8787 with hot reload
```

Then in the admin DevTools console:
```js
localStorage.setItem('cbwm_image_builder_endpoint', 'http://localhost:8787/api/studio/generate');
```

---

## Logs / debugging

```bash
npm run tail   # streams live request logs from the deployed Worker
```

Or visit: https://dash.cloudflare.com → Workers & Pages → crystalbrook-image-builder → Logs

---

## Models we could swap to later

| Model | When to use | Cost |
|---|---|---|
| `@cf/black-forest-labs/flux-1-schnell` | Default — 4 steps, ~3-4 sec/image, good quality | 150 neurons/img |
| `@cf/stabilityai/stable-diffusion-xl-base-1.0` | More artistic / illustrated style | ~250 neurons/img |
| `@cf/lykon/dreamshaper-8-lcm` | Faster but lower quality | 75 neurons/img |
| `@cf/runwayml/stable-diffusion-v1-5-img2img` | Variations of an existing image | ~200 neurons/img |

Change one string in `src/index.js` (`env.AI.run('@cf/black-forest-labs/flux-1-schnell', …)`) to swap models.
