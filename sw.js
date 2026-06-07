/**
 * sw.js — Service Worker para funcionamento offline
 * Cacheia o shell do app na primeira visita.
 */

const CACHE_NAME = 'fitness-os-v1';

const SHELL = [
  '/',
  '/index.html',
  '/css/reset.css',
  '/css/tokens.css',
  '/css/components.css',
  '/css/screens.css',
  '/css/animations.css',
  '/js/storage.js',
  '/js/data.js',
  '/js/utils.js',
  '/js/charts.js',
  '/js/screens/dashboard.js',
  '/js/screens/hydration.js',
  '/js/screens/nutrition.js',
  '/js/screens/workout.js',
  '/js/screens/progress.js',
  '/js/screens/ai.js',
  '/js/router.js',
  '/js/app.js',
  // Fontes são cacheadas pelo browser por padrão via Cache-Control do Google Fonts
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
