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

// ── Push: Handle background push notifications ───────────────────────────────
self.addEventListener("push", (event) => {
  if (!event.data) return;

  try {
    const payload = event.data.json();
    const title = payload.title || "Sachann Manager";
    const options = {
      body: payload.body || "New update received.",
      icon: "/logo.png",
      badge: "/favicon.png",
      data: {
        url: payload.url || "/dashboard",
      },
    };

    // Display background popup notification
    event.waitUntil(
      self.registration.showNotification(title, options)
    );

    // Update app icon badging if supported
    if (self.navigator && "setAppBadge" in self.navigator) {
      event.waitUntil(
        self.navigator.setAppBadge().catch(() => {})
      );
    }

    // Broadcast message to all active client tabs to refresh their unread notifications counts
    event.waitUntil(
      self.clients.matchAll({ type: "window" }).then((clientsList) => {
        clientsList.forEach((client) => {
          client.postMessage({
            type: "PUSH_RECEIVED",
            url: payload.url,
          });
        });
      })
    );
  } catch (err) {
    console.error("Error processing push event:", err);
  }
});

// ── Notification Click: Navigate to url on popup click ────────────────────────
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || "/dashboard";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientsList) => {
      // If a tab is already open, focus it and navigate
      for (const client of clientsList) {
        if (client.url.indexOf(self.location.origin) === 0 && "focus" in client) {
          return client.focus().then((focusedClient) => {
            return focusedClient.navigate(targetUrl);
          });
        }
      }
      // If no tab is open, open a new window
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
