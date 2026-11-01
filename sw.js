// Щоб оновити гру в офлайні після змін — збільште номер версії.
const CACHE = 'shahy-v10';
const FILES = [
  './', './index.html', './chess.js',
  './stockfish-19-lite-single.js', './stockfish-19-lite-single.wasm',
  './manifest.webmanifest', './icon-180.png', './icon-512.png'
];

self.addEventListener('install', e => {
  e.waitUntil((async () => {
    const c = await caches.open(CACHE);
    // Кожен файл окремо: відсутній файл не ламає решту.
    await Promise.all(FILES.map(f => c.add(f).catch(() => {})));
    self.skipWaiting();
  })());
});

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k !== CACHE) await caches.delete(k);
    await self.clients.claim();
  })());
});

// Спершу кеш (швидко й офлайн), у фоні оновлюємо з мережі.
self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET' || new URL(r.url).origin !== location.origin) return;
  e.respondWith((async () => {
    const c = await caches.open(CACHE);
    const hit = await c.match(r, { ignoreSearch: true });
    const net = fetch(r).then(res => { if (res.ok) c.put(r, res.clone()); return res; }).catch(() => null);
    return hit || (await net) || new Response('Офлайн', { status: 503 });
  })());
});
