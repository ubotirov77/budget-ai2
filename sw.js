const CACHE_NAME = "budget-ai2-pwa-v2";

const ASSETS_TO_CACHE = [
  "./",
  "./index.html",
  "./style.css",
  "./script.js",
  "./assets/ai-robot.png"
  // "./lang/en.json",
  // "./lang/uz.json"
];

/* -------------------------------
   INSTALL
-------------------------------- */
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

/* -------------------------------
   ACTIVATE
-------------------------------- */
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

/* -------------------------------
   FETCH
-------------------------------- */
self.addEventListener("fetch", event => {
  const url = event.request.url;

  // 🚫 ABSOLUTELY DO NOT INTERCEPT BACKEND / API CALLS
  if (
    url.includes("budget-ai2.onrender.com") ||
    event.request.method !== "GET"
  ) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;

      return fetch(event.request).then(response => {
        // Cache only successful basic responses
        if (
          !response ||
          response.status !== 200 ||
          response.type !== "basic"
        ) {
          return response;
        }

        const responseClone = response.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, responseClone);
        });

        return response;
      });
    })
  );
});
