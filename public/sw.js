const CACHE = 'giuus-v4'
const STATIC = ['/manifest.json', '/icon-192.png', '/icon-512.png', '/icon-maskable-192.png', '/icon-maskable-512.png']

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(STATIC)))
  self.skipWaiting()
})

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return
  if (e.request.url.includes('/api/')) return
  e.respondWith(
    fetch(e.request)
      .then(res => {
        const clone = res.clone()
        caches.open(CACHE).then(c => c.put(e.request, clone))
        return res
      })
      .catch(() => caches.match(e.request))
  )
})

// ── Push Notifications ──────────────────────────────

self.addEventListener('push', function (event) {
  if (!event.data) return
  let data = {}
  try { data = event.data.json() } catch { data = { title: 'עדכון חדש', body: event.data.text() } }

  const title   = data.title ?? 'מערכת גיוס'
  const options = {
    body:    data.body  ?? '',
    icon:    '/logo-chabad.png',
    badge:   '/logo-chabad.png',
    dir:     'rtl',
    lang:    'he',
    data:    { url: data.url ?? '/notifications' },
  }
  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', function (event) {
  event.notification.close()
  const url = event.notification.data?.url ?? '/notifications'
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(function (clientList) {
      for (const client of clientList) {
        if (client.url === url && 'focus' in client) return client.focus()
      }
      if (clients.openWindow) return clients.openWindow(url)
    })
  )
})
