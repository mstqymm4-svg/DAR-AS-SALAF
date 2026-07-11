// Service Worker for Dar Al-Uloom PWA
const CACHE_NAME = "dar-al-ulum-v2";
const PRECACHE = [
  "/",
  "/index.html",
  "/manifest.json",
];

// Assets that should bypass cache in dev or use network-first
const DEV_BYPASS_PATTERNS = [
  "/src/",
  "/node_modules/.vite",
  "/@vite",
  "/@react-refresh",
];

// Check if URL is a JS/CSS chunk from Vite
function isViteAsset(url) {
  return (
    url.pathname.startsWith("/src/") ||
    url.pathname.startsWith("/node_modules/") ||
    url.pathname.startsWith("/@vite") ||
    url.pathname.startsWith("/@react-refresh") ||
    url.pathname.endsWith(".js") ||
    url.pathname.endsWith(".css") ||
    url.pathname.endsWith(".jsx") ||
    url.pathname.endsWith(".tsx")
  );
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  let url;
  try {
    url = new URL(request.url);
  } catch (e) {
    return;
  }

  // Never cache Vite dev assets, HMR, or JS/CSS chunks — always network
  if (isViteAsset(url)) {
    event.respondWith(fetch(request));
    return;
  }

  // Navigation requests: network-first (so latest HTML always loads)
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(() => caches.match(request).then((r) => r || caches.match("/index.html")))
    );
    return;
  }

  // Static assets: cache-first with network fallback
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        if (response && response.status === 200 && url.origin === self.location.origin) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      });
    })
  );
});
