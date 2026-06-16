/**
 * sw.js — Service Worker para funcionamento offline
 * Cacheia o shell do app na primeira visita.
 */

const CACHE_NAME = 'fitness-os-v8';

const SHELL = [
  '/',
  '/index.html',
  '/css/reset.css?v=20260615g',
  '/css/tokens.css?v=20260615g',
  '/css/components.css?v=20260615g',
  '/css/screens.css?v=20260615g',
  '/css/animations.css?v=20260615g',
  '/js/storage.js?v=20260615g',
  '/js/data.js?v=20260615g',
  '/js/utils.js?v=20260615g',
  '/js/charts.js?v=20260615g',
  '/js/screens/dashboard.js?v=20260615g',
  '/js/screens/hydration.js?v=20260615g',
  '/js/screens/nutrition.js?v=20260615g',
  '/js/screens/workout.js?v=20260615g',
  '/js/screens/progress.js?v=20260615g',
  '/js/screens/health.js?v=20260615g',
  '/js/screens/ai.js?v=20260615g',
  '/js/screens/config.js?v=20260615g',
  '/js/screens/auth.js?v=20260615g',
  '/js/router.js?v=20260615g',
  '/js/app.js?v=20260615g',
];

// Instalar: cacheia o shell
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(SHELL))
      .then(() => self.skipWaiting())
  );
});

// Ativar: remove caches antigos
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k => k !== CACHE_NAME)
          .map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// Fetch: network-first (sempre busca a versão mais recente quando online),
// com fallback para cache quando offline. Evita servir versões antigas
// após um novo deploy.
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  if (event.request.method !== 'GET') return;
  if (url.origin !== location.origin && !url.hostname.includes('fonts.g')) return;

  event.respondWith(
    fetch(event.request).then(response => {
      if (response && response.status === 200 && response.type !== 'opaque') {
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
      }
      return response;
    }).catch(() =>
      caches.match(event.request).then(cached => {
        if (cached) return cached;
        if (event.request.destination === 'document') {
          return caches.match('/index.html');
        }
      })
    )
  );
});
