/* Crystal Brook Wall Mounts — Service Worker
 * Strategy:
 *   - Pre-cache the app shell on install
 *   - Network-first for navigation requests (so updates land fast)
 *   - Cache-first for static assets (CSS/JS/images/SVGs)
 *   - Offline fallback to cached index.html for navigation
 */

const VERSION = 'cbwm-2026-04-23-04';
const SHELL_CACHE = `${VERSION}-shell`;
const RUNTIME_CACHE = `${VERSION}-runtime`;

const SHELL = [
  '/',
  '/index.html',
  '/about.html',
  '/shop.html',
  '/admin/index.html',
  '/manifest.webmanifest',
  '/assets/styles.css',
  '/assets/app.js',
  '/assets/admin.css',
  '/assets/favicon.svg',
  '/assets/icon-192.svg',
  '/assets/icon-512.svg',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) =>
      // Use addAll with allSettled-style handling so a single 404 doesn't break install
      Promise.all(
        SHELL.map((url) =>
          fetch(url, { cache: 'no-cache' })
            .then((res) => (res.ok ? cache.put(url, res.clone()) : null))
            .catch(() => null)
        )
      )
    ).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k))
      );
      await self.clients.claim();
    })()
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  // Skip cross-origin (Google Fonts etc.) — let the network handle them
  if (url.origin !== self.location.origin) return;

  // Navigation requests → network-first with offline fallback
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(RUNTIME_CACHE).then((cache) => cache.put(req, copy));
          return res;
        })
        .catch(() =>
          caches.match(req).then(
            (cached) =>
              cached ||
              caches.match('/index.html') ||
              new Response('Offline', { status: 503, statusText: 'Offline' })
          )
        )
    );
    return;
  }

  // Static assets → cache-first
  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req).then((res) => {
        if (!res || res.status !== 200 || res.type !== 'basic') return res;
        const copy = res.clone();
        caches.open(RUNTIME_CACHE).then((cache) => cache.put(req, copy));
        return res;
      }).catch(() => cached);
    })
  );
});

// Allow page to ask for an update
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});
