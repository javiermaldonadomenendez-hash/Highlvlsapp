const CACHE_NAME = 'highlevels-v1'
const STATIC_ASSETS = [
  '/',
  '/emoji/lucasfreude.png',
  '/emoji/lucassauer.png',
  '/emoji/lucastraurig.png',
]

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS))
  )
  self.skipWaiting()
})

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return
  const url = new URL(e.request.url)
  // Don't cache API routes or Supabase calls
  if (url.pathname.startsWith('/api/') || url.hostname.includes('supabase')) return
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached
      return fetch(e.request).then(res => {
        if (!res || res.status !== 200 || res.type !== 'basic') return res
        const clone = res.clone()
        caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone))
        return res
      }).catch(() => cached)
    })
  )
})

self.addEventListener('push', e => {
  let data = {}
  if (e.data) {
    try { data = e.data.json() } catch { data = { title: 'Highlevels', body: e.data.text() } }
  }
  e.waitUntil(
    self.registration.showNotification(data.title || 'Highlevels', {
      body:  data.body  || '',
      icon:  data.icon  || '/emoji/lucasfreude.png',
      badge: data.badge || '/emoji/lucasfreude.png',
      tag:   data.tag   || 'hl-push',
      data:  { url: data.url || '/' },
    })
  )
})

self.addEventListener('notificationclick', e => {
  e.notification.close()
  const target = e.notification.data?.url || '/'
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      for (const c of list) {
        if (c.url.includes(target) && 'focus' in c) return c.focus()
      }
      if (clients.openWindow) return clients.openWindow(target)
    })
  )
})
