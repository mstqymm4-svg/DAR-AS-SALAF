/* Dar Al Uloom — offline service worker (app shell + assets) */
const SHELL = "dau-shell-v1";
const ASSETS = "dau-assets-v1";

// App shell: the HTML entry so the app can boot with no network at all.
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(SHELL).then((c) => c.addAll(["/", "/index.html", "/manifest.json"]).catch(() => {}))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== SHELL && k !== ASSETS).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

const isAsset = (url) =>
  /\.(js|css|woff2?|ttf|otf|png|jpe?g|svg|webp|gif|ico)$/i.test(url.pathname) ||
  url.pathname.startsWith("/assets/");

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);

  // Never cache API / auth traffic — data offline is served from IndexedDB.
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/functions/")) return;

  // Page navigations: network first, fall back to the cached shell.
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          caches.open(SHELL).then((c) => c.put("/index.html", res.clone()));
          return res;
        })
        .catch(() => caches.match("/index.html"))
    );
    return;
  }

  // Static assets (same origin + cross-origin fonts/images): cache first.
  if (isAsset(url)) {
    event.respondWith(
      caches.match(req).then(
        (hit) =>
          hit ||
          fetch(req)
            .then((res) => {
              if (res.ok || res.type === "opaque") {
                caches.open(ASSETS).then((c) => c.put(req, res.clone()));
              }
              return res;
            })
            .catch(() => hit)
      )
    );
  }
});
