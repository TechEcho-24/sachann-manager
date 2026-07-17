// Sachann Manager — Auto-updating Service Worker
// Strategy: Network-first (always fetch fresh from server when online)
// Auto-update: skipWaiting + clients.claim() = instant update on new deploy

const CACHE_NAME = "sachann-v1";

// Assets to pre-cache (shell only — no API routes)
const PRECACHE_URLS = [
  "/",
  "/dashboard",
  "/manifest.json",
  "/favicon.png",
  "/logo.png",
];

// ── Install: pre-cache shell assets ─────────────────────────────────────────
self.addEventListener("install", (event) => {
  // skipWaiting: activate new SW immediately without waiting for old tabs to close
  self.skipWaiting();

  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS).catch(() => {}))
  );
});

// ── Activate: claim all clients immediately ──────────────────────────────────
self.addEventListener("activate", (event) => {
  // clients.claim: take control of all open tabs immediately
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      // Delete old cache versions
      caches.keys().then((keys) =>
        Promise.all(
          keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
        )
      ),
    ])
  );
});

// ── Fetch: Network-first strategy ───────────────────────────────────────────
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET, chrome-extension, and API routes (never cache these)
  if (
    request.method !== "GET" ||
    url.protocol === "chrome-extension:" ||
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/_next/webpack-hmr")
  ) {
    return;
  }

  // Next.js static assets (_next/static) — cache-first (they're content-hashed)
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        });
      })
    );
    return;
  }

  // Everything else — Network-first (always fresh from server)
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      })
      .catch(() => {
        // Offline fallback: serve from cache
        return caches.match(request).then((cached) => {
          if (cached) return cached;
          // If nothing cached, return offline page for navigation requests
          if (request.mode === "navigate") {
            return caches.match("/dashboard");
          }
        });
      })
  );
});

// ── Message: force update from UI ───────────────────────────────────────────
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
