/*
 * Screens Player offline cache (service worker, scope /player/).
 *
 * Goal: when a venue loses its internet, the screen keeps playing the last
 * menu instead of going blank, and a reload while offline still shows it.
 *
 *  - Player page (navigations): network first, cached copy if offline.
 *  - App code (/_next/static, fonts): cache first; these files are versioned.
 *  - Media: the player posts its current file list; we download each file
 *    once and serve it from the cache, including the Range requests video
 *    elements make. Signed URLs change on every manifest fetch, so media is
 *    keyed by path without the query string.
 *  - API calls are never cached (the player keeps its manifest itself).
 */

const VERSION = 'screens-sw-v1'
const SHELL = `${VERSION}-shell`
const STATIC = `${VERSION}-static`
const MEDIA = 'screens-media-v1' // survives SW updates so media isn't re-downloaded

self.addEventListener('install', () => self.skipWaiting())

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keep = new Set([SHELL, STATIC, MEDIA])
    for (const key of await caches.keys()) if (!keep.has(key)) await caches.delete(key)
    await self.clients.claim()
  })())
})

function mediaKey(url) {
  const u = new URL(url)
  return `${u.origin}${u.pathname}`
}

function isStatic(url) {
  return url.origin === self.location.origin &&
    (url.pathname.startsWith('/_next/static/') || url.pathname.startsWith('/fonts/') || url.pathname.startsWith('/brand/'))
}

function isMedia(url) {
  return /\/storage\/v1\/object\//.test(url.pathname) || /\.(mp4|webm|mov|m4v|jpe?g|png|webp|gif)$/i.test(url.pathname)
}

async function networkFirst(request) {
  const cache = await caches.open(SHELL)
  try {
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), 6000)
    const res = await fetch(request, { signal: ctrl.signal })
    clearTimeout(timer)
    if (res.ok) cache.put(request, res.clone())
    return res
  } catch (err) {
    const cached = await cache.match(request, { ignoreSearch: true })
    if (cached) return cached
    throw err
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(STATIC)
  const cached = await cache.match(request)
  if (cached) return cached
  const res = await fetch(request)
  if (res.ok) {
    await cache.put(request, res.clone())
    // Each deploy adds new hashed files; keep the newest few hundred.
    const keys = await cache.keys()
    for (let i = 0; i < keys.length - 400; i++) await cache.delete(keys[i])
  }
  return res
}

// Build a 206 from a cached full response so <video> can seek and loop offline.
async function rangeResponse(full, rangeHeader) {
  const blob = await full.blob()
  const m = /bytes=(\d*)-(\d*)/.exec(rangeHeader || '')
  if (!m) return new Response(blob, { status: 200, headers: full.headers })
  const size = blob.size
  let start = m[1] === '' ? size - Number(m[2]) : Number(m[1])
  let end = m[1] !== '' && m[2] !== '' ? Number(m[2]) : size - 1
  start = Math.max(0, start); end = Math.min(end, size - 1)
  if (start > end) return new Response(null, { status: 416, headers: { 'Content-Range': `bytes */${size}` } })
  return new Response(blob.slice(start, end + 1), {
    status: 206,
    headers: {
      'Content-Type': full.headers.get('Content-Type') || 'application/octet-stream',
      'Content-Range': `bytes ${start}-${end}/${size}`,
      'Content-Length': String(end - start + 1),
      'Accept-Ranges': 'bytes',
    },
  })
}

async function fromMediaCache(request) {
  const cache = await caches.open(MEDIA)
  const cached = await cache.match(mediaKey(request.url))
  if (!cached) return fetch(request)
  const range = request.headers.get('range')
  // Opaque copies (media host without CORS) can't be sliced; a full 200 still plays.
  return range && cached.type !== 'opaque' ? rangeResponse(cached, range) : cached
}

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return
  const url = new URL(request.url)

  if (request.mode === 'navigate' && url.pathname.startsWith('/player/')) {
    event.respondWith(networkFirst(request))
    return
  }
  if (url.origin === self.location.origin && url.pathname.startsWith('/api/')) return
  if (isStatic(url)) {
    event.respondWith(cacheFirst(request))
    return
  }
  if (isMedia(url)) {
    event.respondWith(fromMediaCache(request))
  }
})

// The player sends { type: 'cache-media', urls: [...] } after each manifest.
// Download anything missing, then drop files no longer in use.
let syncing = Promise.resolve()
self.addEventListener('message', (event) => {
  const data = event.data
  if (!data || data.type !== 'cache-media' || !Array.isArray(data.urls)) return
  syncing = syncing.then(() => syncMedia(data.urls)).catch(() => {})
  event.waitUntil(syncing)
})

async function syncMedia(urls) {
  const cache = await caches.open(MEDIA)
  const wanted = new Map()
  for (const u of urls) {
    try { wanted.set(mediaKey(u), u) } catch {}
  }
  for (const [key, url] of wanted) {
    if (await cache.match(key)) continue
    try {
      let res
      try {
        res = await fetch(url, { mode: 'cors', credentials: 'omit' })
      } catch {
        // Media host without CORS headers: keep an opaque copy instead.
        res = await fetch(url, { mode: 'no-cors', credentials: 'omit' })
      }
      if ((res.ok && res.status === 200) || res.type === 'opaque') await cache.put(key, res)
    } catch {
      // Offline or out of space; try again on the next manifest.
    }
  }
  for (const req of await cache.keys()) {
    if (!wanted.has(req.url)) await cache.delete(req)
  }
}
