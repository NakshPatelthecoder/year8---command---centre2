const CACHE_NAME = "y8-command-centre-v2";
const STATIC_ASSETS = [
  "./icon-192.png",
  "./icon-512.png",
  "./icon-maskable-512.png",
  "./apple-touch-icon.png"
];
const APP_SHELL = [
  "./",
  "./index.html",
  "./manifest.json"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll([...APP_SHELL, ...STATIC_ASSETS]))
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

self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // other origins (AI API, fonts) untouched

  const isStaticAsset = STATIC_ASSETS.some((a) => url.pathname.endsWith(a.replace("./", "")));

  if (isStaticAsset) {
    // icons never change day to day — cache-first is safe and saves bandwidth
    event.respondWith(caches.match(req).then((cached) => cached || fetch(req)));
    return;
  }

  // app shell (index.html, manifest.json, "/"): ALWAYS try the network first so a
  // freshly-uploaded version is picked up immediately. Only fall back to the
  // cached copy if there's no connection.
  event.respondWith(
    fetch(req)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
        return res;
      })
      .catch(() => caches.match(req))
  );
});
