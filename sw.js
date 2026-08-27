const CACHE_NAME = "y8-command-centre-v1";
const CORE_ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png",
  "./icon-maskable-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n)))
    )
  );
  self.clients.claim();
});

// Cache-first for core app shell, network-first for everything else (so the
// AI agent and any future API calls still hit the network when online).
self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);
  const isCoreAsset = url.origin === self.location.origin && CORE_ASSETS.some((a) => url.pathname.endsWith(a.replace("./", "")));

  if (isCoreAsset) {
    event.respondWith(
      caches.match(req).then((cached) => cached || fetch(req))
    );
  } else if (url.origin === self.location.origin) {
    event.respondWith(
      fetch(req).catch(() => caches.match(req))
    );
  }
  // requests to other origins (e.g. the AI API, fonts) go straight to network untouched
});
