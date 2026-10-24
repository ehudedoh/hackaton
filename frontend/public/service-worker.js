const CACHE_NAME = 'jurilex-ui-v1';
const PRECACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/icon-512-maskable.png',
  '/icons/apple-touch-icon.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE)),
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)),
      ),
    ),
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  if (request.method !== 'GET') {
    return;
  }

  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/samples/')) {
    return;
  }

  if (url.protocol === 'blob:' || url.protocol === 'data:') {
    return;
  }

  const destination = request.destination;
  if (destination === 'audio' || destination === 'video') {
    return;
  }

  const isSameOrigin = url.origin === self.location.origin;
  if (!isSameOrigin) {
    return;
  }

  const isUiAsset =
    request.mode === 'navigate' ||
    destination === 'style' ||
    destination === 'script' ||
    destination === 'image' ||
    destination === 'font' ||
    url.pathname === '/manifest.json';

  if (!isUiAsset) {
    return;
  }

  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok && destination !== '') {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        }
        return response;
      })
      .catch(() => caches.match(request).then((cached) => cached || caches.match('/index.html'))),
  );
});
