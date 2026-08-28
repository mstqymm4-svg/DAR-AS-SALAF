// Service Worker for Dar Al-Uloom PWA.
// Self-healing: if it ever activates inside a Vite dev/preview context (where
// the app is served from /src/main.jsx, /@vite, or /node_modules/.vite), it
// wipes every cache and UNREGISTERS itself on activate — so a stale worker
// from a prior dev session can't keep cache-serving an old/broken bundle
// (the root cause of "dispatcher.useState is null" hook errors). In prod it
// behaves as a normal offline-first PWA worker.

const CACHE_NAME = "dar-al-ulum-v3";

// Vite dev assets must always bypass the cache (network-only).
const DEV_BYPASS_PATTERNS = [
  "/src/",
  "/node_modules/.vite",
  "/@vite",
  "/@react-refresh",
];

function isDevAsset(url) {
  return DEV_BYPASS_PATTERNS.some((p) => url.pathname.includes(p));
}

// Detect a dev/preview context by inspecting the served index.html.
async function isDevContext() {
  try {
    const res = await fetch(self.registration.scope, { cache: "no-store" });
    const html = await res.text();
    return (
      html.includes("/src/main.jsx") ||
      html.includes("/@vite") ||
      html.includes("/node_modules/.vite")
    );
  } catch (e) {
    return false;
  }
}

self.addEventListener("install", (event) => {
  // Skip waiting so an updated worker takes over immediately.
  self.skipWaiting();
  // In dev we precache nothing (we will unregister on activate anyway).
  event.waitUntil(
    (async () => {
      if (await isDevContext()) return;
      const cache = await caches.open(CACHE_NAME);
      return cache.addAll(["/", "/index.html", "/manifest.json"]).catch(() => {});
    })()
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      if (await isDevContext()) {
        // Dev/preview: destroy every cache and remove this worker entirely.
        await Promise.all(keys.map((k) => caches.delete(k)));
        await self.clients.claim();
        await self.registration.unregister();
        return;
      }
      // Prod: drop outdated caches, keep current, take over clients.
      await Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      );
      await self.clients.claim();
    })()
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  let url;
  try {
    url = new URL(req.url);
  } catch (e) {
    return;
  }

  // Navigation requests: network-first (never serve a stale app shell).
  if (req.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          const fresh = await fetch(req, { cache: "no-store" });
          const cache = await caches.open(CACHE_NAME);
          cache.put("/", fresh.clone()).catch(() => {});
          return fresh;
        } catch (e) {
          const cache = await caches.open(CACHE_NAME);
          return (await cache.match("/")) || Response.error();
        }
      })()
    );
    return;
  }

  // Same-origin only.
  if (url.origin !== self.location.origin) return;

  // Vite dev assets / source modules: network-only, never cached here.
  if (isDevAsset(url)) {
    event.respondWith(fetch(req, { cache: "no-store" }).catch(() => Response.error()));
    return;
  }

  // Other same-origin static assets: stale-while-revalidate (fresh preferred,
  // cache fallback for offline) — safe for hashed prod assets.
  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      const cached = await cache.match(req);
      const network = fetch(req)
        .then((res) => {
          cache.put(req, res.clone()).catch(() => {});
          return res;
        })
        .catch(() => cached);
      return cached || network;
    })()
  );
});
