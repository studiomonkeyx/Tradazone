// Service Worker — Tradazone
// Strategy:
//   HTML navigation requests → always fetch from network (never serve stale index.html)
//   Vite hashed assets (/assets/…) → cache-first (content-hash guarantees freshness)
//   Everything else → network-first with cache fallback

const ASSET_CACHE = 'tz-assets-v1';

self.addEventListener('install', () => {
  // Activate immediately without waiting for old SW to finish
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // Delete any old caches from previous SW versions, then claim all clients
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((k) => k !== ASSET_CACHE).map((k) => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Only handle same-origin requests
  if (url.origin !== self.location.origin) return;

  // HTML navigation: always go to the network so index.html is never stale
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    );
    return;
  }

  // Vite-hashed assets: cache-first (filename changes on every build)
  if (url.pathname.includes('/assets/')) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;
        return fetch(event.request).then((response) => {
          const clone = response.clone();
          caches.open(ASSET_CACHE).then((cache) => cache.put(event.request, clone));
          return response;
        });
      })
    );
    return;
  }

  // Everything else: network-first, fall back to cache
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
