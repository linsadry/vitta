/**
 * sw.js — Service Worker Vitta+ v9
 */
const CACHE_NAME = 'fitness-os-v9';

const SHELL = [
  '/','/index.html',
  '/css/reset.css?v=20260616a','/css/tokens.css?v=20260616a','/css/components.css?v=20260616a',
  '/css/screens.css?v=20260616a','/css/animations.css?v=20260616a',
  '/js/storage.js?v=20260616a','/js/data.js?v=20260616a','/js/utils.js?v=20260616a',
  '/js/charts.js?v=20260616a','/js/router.js?v=20260616a','/js/app.js?v=20260616a',
  '/js/screens/dashboard.js?v=20260616a','/js/screens/hydration.js?v=20260616a',
  '/js/screens/nutrition.js?v=20260616a','/js/screens/workout.js?v=20260616a',
  '/js/screens/progress.js?v=20260616a','/js/screens/health.js?v=20260616a',
  '/js/screens/ai.js?v=20260616a','/js/screens/config.js?v=20260616a',
  '/js/screens/auth.js?v=20260616a','/js/sw-register.js?v=20260616a',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== location.origin && !url.hostname.includes('fonts.g')) return;
  event.respondWith(
    fetch(event.request).then(res => {
      if (res && res.status === 200 && res.type !== 'opaque') {
        const clone = res.clone();
        caches.open(CACHE_NAME).then(c => c.put(event.request, clone));
      }
      return res;
    }).catch(() =>
      caches.match(event.request).then(cached => {
        if (cached) return cached;
        if (event.request.destination === 'document') return caches.match('/index.html');
      })
    )
  );
});
