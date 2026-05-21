/* studyTeach service worker.
 * Policies tracked in docs/OFFLINE_STRATEGY.md.
 * Cache strategies:
 *   static + curriculum + tickets  → cache-first
 *   /api/olympiads /api/study-abroad/* /api/teacher-academy/courses → SWR
 *   /api/registrations /api/payments /api/auth/*  → network-first (writes are sync-queued client-side)
 *   /api/wellbeing/*               → NEVER cached (constraint #6)
 *   /_next/static                  → cache-first
 *   /_next/(?!static), /__nextjs   → bypass (let HMR / RSC work in dev)
 */

const SW_VERSION = 'st-pwa-v1-2026-05-21';
const STATIC_CACHE = `${SW_VERSION}-static`;
const SWR_CACHE = `${SW_VERSION}-swr`;
const NEXT_STATIC_CACHE = `${SW_VERSION}-next-static`;

const PRECACHE = [
  '/manifest.webmanifest',
  '/icons/icon-192.svg',
  '/icons/icon-512.svg',
  '/icons/icon-maskable-512.svg',
  '/icons/apple-touch-icon.svg',
  '/offline.html',
];

const NEVER_CACHE = [/^\/api\/wellbeing\//];
const NETWORK_FIRST = [/^\/api\/registrations(\/|$)/, /^\/api\/payments(\/|$)/, /^\/api\/auth\//];
const SWR = [
  /^\/api\/olympiads(\/|$|\?)/,
  /^\/api\/study-abroad\//,
  /^\/api\/teacher-academy\/courses/,
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((c) => c.addAll(PRECACHE))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => !k.startsWith(SW_VERSION)).map((k) => caches.delete(k)));
      await self.clients.claim();
    })(),
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
  if (event.data && event.data.type === 'REPLAY_QUEUE') {
    self.clients
      .matchAll()
      .then((clients) => clients.forEach((c) => c.postMessage({ type: 'REPLAY_QUEUE' })));
  }
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  if (url.pathname.startsWith('/__nextjs') || url.pathname.startsWith('/_next/webpack-hmr')) {
    return;
  }
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(cacheFirst(req, NEXT_STATIC_CACHE));
    return;
  }
  if (matchAny(url.pathname, NEVER_CACHE)) {
    event.respondWith(fetch(req));
    return;
  }
  if (matchAny(url.pathname, NETWORK_FIRST)) {
    event.respondWith(networkFirst(req));
    return;
  }
  if (matchAny(url.pathname, SWR)) {
    event.respondWith(staleWhileRevalidate(req));
    return;
  }
  if (req.mode === 'navigate' || req.destination === 'document') {
    event.respondWith(networkFirstDocument(req));
    return;
  }
  event.respondWith(cacheFirst(req, STATIC_CACHE));
});

function matchAny(pathname, patterns) {
  return patterns.some((re) => re.test(pathname));
}

async function cacheFirst(req, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(req);
  if (cached) return cached;
  try {
    const res = await fetch(req);
    if (res.ok && (res.type === 'basic' || res.type === 'default')) cache.put(req, res.clone());
    return res;
  } catch {
    return caches.match('/offline.html').then((r) => r || new Response('offline', { status: 503 }));
  }
}

async function networkFirst(req) {
  try {
    return await fetch(req);
  } catch {
    return new Response(JSON.stringify({ error: 'offline_queued' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

async function networkFirstDocument(req) {
  try {
    const res = await fetch(req);
    return res;
  } catch {
    const offline = await caches.match('/offline.html');
    return offline || new Response('offline', { status: 503 });
  }
}

async function staleWhileRevalidate(req) {
  const cache = await caches.open(SWR_CACHE);
  const cached = await cache.match(req);
  const networkPromise = fetch(req)
    .then((res) => {
      if (res.ok) cache.put(req, res.clone());
      return res;
    })
    .catch(() => undefined);
  return cached || (await networkPromise) || new Response('offline', { status: 503 });
}
