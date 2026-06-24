const CACHE_NAME = 'jgfit-v1';
const PRECACHE_URLS = ['/login', '/'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      try {
        const cache = await caches.open(CACHE_NAME);
        await cache.addAll(PRECACHE_URLS);
      } catch (err) {
        // ignore precache failures so install never blocks
      }
    })()
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // network-first, fall back to cache when offline
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
