/**
 * sw.js — Service Worker para funcionamento offline
 * Cacheia o shell do app na primeira visita.
 */

const CACHE_NAME = 'fitness-os-v3';

const SHELL = [
  '/',
  '/index.html',
  '/css/reset.css?v=20260615b',
  '/css/tokens.css?v=20260615b',
  '/css/components.css?v=20260615b',
  '/css/screens.css?v=20260615b',
  '/css/animations.css?v=20260615b',
  '/js/storage.js?v=20260615b',
  '/js/data.js?v=20260615b',
  '/js/utils.js?v=20260615b',
  '/js/charts.js?v=20260615b',
  '/js/screens/dashboard.js?v=20260615b',
  '/js/screens/hydration.js?v=20260615b',
  '/js/screens/nutrition.js?v=20260615b',
  '/js/screens/workout.js?v=20260615b',
  '/js/screens/progress.js?v=20260615b',
  '/js/screens/ai.js?v=20260615b',
  '/js/screens/config.js?v=20260615b',
  '/js/screens/auth.js?v=20260615b',
  '/js/router.js?v=20260615b',
  '/js/app.js?v=20260615b',
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

// Fetch: network-first (sempre busca a versão mais recente quando online),
// com fallback para cache quando offline. Evita servir versões antigas
// após um novo deploy.
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Ignorar requests não-GET e requests externos (analytics, etc.)
  if (event.request.method !== 'GET') return;
  if (url.origin !== location.origin && !url.hostname.includes('fonts.g')) return;

  event.respondWith(
    fetch(event.request).then(response => {
      // Cachear apenas respostas válidas, para uso offline
      if (response && response.status === 200 && response.type !== 'opaque') {
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
      }
      return response;
    }).catch(() =>
      caches.match(event.request).then(cached => {
        if (cached) return cached;
        // Fallback para o index.html em caso de erro de rede (navegação)
        if (event.request.destination === 'document') {
          return caches.match('/index.html');
        }
      })
    )
  );
});
