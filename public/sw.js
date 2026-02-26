const CACHE_NAME = "design-dna-v1";
const STATIC_ASSETS = [
  "/",
  "/library",
  "/boards",
  "/manifest.json",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
];

// Install: precache static assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: network-first for pages, cache-first for static assets
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET and cross-origin
  if (request.method !== "GET" || url.origin !== self.location.origin) return;

  // API routes: network only
  if (url.pathname.startsWith("/api/")) return;

  // Images from Supabase storage: cache-first
  if (request.destination === "image") {
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

  // Pages/assets: network-first, fall back to cache
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      })
      .catch(() => caches.match(request))
  );
});

// Handle share target
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (url.pathname === "/api/share-target" && event.request.method === "POST") {
    event.respondWith(
      (async () => {
        const formData = await event.request.formData();
        const image = formData.get("image");
        // Store in a temporary cache for the client to pick up
        if (image) {
          const cache = await caches.open("share-target");
          await cache.put("/shared-image", new Response(image));
        }
        return Response.redirect("/library?shared=true", 303);
      })()
    );
  }
});
