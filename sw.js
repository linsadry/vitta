/**
 * sw.js — Service Worker para funcionamento offline
 * Cacheia o shell do app na primeira visita.
 */

const CACHE_NAME = 'fitness-os-v2';

const SHELL = [
  '/',
  '/index.html',
  '/css/reset.css?v=20260615a',
  '/css/tokens.css?v=20260615a',
  '/css/components.css?v=20260615a',
  '/css/screens.css?v=20260615a',
  '/css/animations.css?v=20260615a',
  '/js/storage.js?v=20260615a',
  '/js/data.js?v=20260615a',
  '/js/utils.js?v=20260615a',
  '/js/charts.js?v=20260615a',
  '/js/screens/dashboard.js?v=20260615a',
  '/js/screens/hydration.js?v=20260615a',
  '/js/screens/nutrition.js?v=20260615a',
  '/js/screens/workout.js?v=20260615a',
  '/js/screens/progress.js?v=20260615a',
  '/js/screens/ai.js?v=20260615a',
  '/js/screens/config.js?v=20260615a',
  '/js/screens/auth.js?v=20260615a',
  '/js/router.js?v=20260615a',
  '/js/app.js?v=20260615a',
  // Fontes são cacheadas pelo browser por padrão via Cache-Control do Google Fonts
  // Supabase JS (CDN) é cacheado pelo browser, não pelo SW
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

// Fetch: cache-first para o shell, network-first para o resto
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Ignorar requests não-GET e requests externos (analytics, etc.)
  if (event.request.method !== 'GET') return;
  if (url.origin !== location.origin && !url.hostname.includes('fonts.g')) return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;

      return fetch(event.request).then(response => {
        // Cachear apenas respostas válidas
        if (response && response.status === 200 && response.type !== 'opaque') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => {
        // Fallback para o index.html em caso de erro de rede
        if (event.request.destination === 'document') {
          return caches.match('/index.html');
        }
      });
    })
  );
});
