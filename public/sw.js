// Vitta+ Service Worker — v8
// Network-first strategy to avoid stale content; cache fallback for offline.
const CACHE = 'vitta-v8'
const ASSETS = ['/', '/index.html', '/manifest.json', '/icon-192.png', '/icon-512.png']

self.addEventListener('install', (event) => {
  self.skipWaiting()
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(ASSETS).catch(() => {}))
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  // Only handle GET; never intercept Supabase / API calls
  if (request.method !== 'GET') return
  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return  // skip cross-origin (Supabase, fonts API)

  event.respondWith(
    fetch(request)
      .then((response) => {
        // Clone BEFORE the body is consumed, guard against opaque/error responses
        if (response && response.status === 200 && response.type === 'basic') {
          const copy = response.clone()
          caches.open(CACHE).then((cache) => cache.put(request, copy)).catch(() => {})
        }
        return response
      })
      .catch(() => caches.match(request).then((cached) => cached || caches.match('/index.html')))
  )
})

// ─── PUSH NOTIFICATIONS (medication reminders) ───────────────────
self.addEventListener('push', (event) => {
  let data = {}
  try { data = event.data ? event.data.json() : {} } catch (e) { data = { title: 'Vitta+', body: event.data ? event.data.text() : '' } }
  const title = data.title || 'Vitta+'
  const options = {
    body: data.body || 'Lembrete de medicamento',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: data.tag || 'vitta-reminder',
    data: data.url || '/',
    vibrate: [80, 40, 80],
  }
  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((list) => {
      for (const c of list) { if ('focus' in c) return c.focus() }
      if (self.clients.openWindow) return self.clients.openWindow(event.notification.data || '/')
    })
  )
})
