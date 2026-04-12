/**
 * AlyraGames Service Worker
 * Cache-first strategy for static assets, stale-while-revalidate for HTML.
 * Makes games load instantly on revisit + offline support.
 */
const CACHE_VERSION = 'v2';
const STATIC_CACHE = `alyragames-static-${CACHE_VERSION}`;
const HTML_CACHE = `alyragames-html-${CACHE_VERSION}`;

// Core files to precache (hub + SDK)
const PRECACHE = [
  '/',
  '/index.html',
  '/leaderboards.html',
  '/profile.html',
  '/daily.html',
  '/alyragames-sdk.js',
  '/game-integration.js',
  '/game-rules.js',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== STATIC_CACHE && k !== HTML_CACHE && k.startsWith('alyragames-'))
          .map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // Only cache our own origin
  if (url.origin !== location.origin) return;

  // Don't cache API calls (Supabase) — let them hit the network
  if (url.hostname.includes('supabase.co')) return;

  const isHTML = req.mode === 'navigate' ||
    (req.headers.get('accept') || '').includes('text/html');

  // Assets (JS, CSS, images) — cache first
  if (/\.(js|css|woff2?|ttf|png|jpg|jpeg|webp|svg|ico)$/i.test(url.pathname)) {
    event.respondWith(
      caches.match(req).then((cached) => {
        if (cached) return cached;
        return fetch(req).then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(STATIC_CACHE).then((c) => c.put(req, copy));
          }
          return res;
        }).catch(() => cached);
      })
    );
    return;
  }

  // HTML — stale while revalidate (fast + fresh)
  if (isHTML) {
    event.respondWith(
      caches.open(HTML_CACHE).then((cache) =>
        cache.match(req).then((cached) => {
          const fetchPromise = fetch(req).then((res) => {
            if (res.ok) cache.put(req, res.clone());
            return res;
          }).catch(() => cached);
          return cached || fetchPromise;
        })
      )
    );
  }
});
