// Service worker minimale: cache app-shell per funzionamento offline.
// La cache viene invalidata cambiando CACHE_VERSION ad ogni build.
const CACHE_VERSION = 'leadscan-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(['./', './index.html', './manifest.json']))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  // Non mettere in cache le chiamate alle API AI (Gemini/OpenAI)
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Strategia: network-first con fallback cache (app sempre aggiornata se online)
  event.respondWith(
    fetch(request)
      .then((resp) => {
        const copy = resp.clone();
        caches.open(CACHE_VERSION).then((cache) => cache.put(request, copy));
        return resp;
      })
      .catch(() => caches.match(request).then((r) => r || caches.match('./index.html')))
  );
});
