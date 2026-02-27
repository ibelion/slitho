/* coi-serviceworker v0.1.7 - Marian Schedenig <m.schedenig@gmail.com> */
/* Adds Cross-Origin-Opener-Policy and Cross-Origin-Embedder-Policy headers  */
/* via a Service Worker, enabling SharedArrayBuffer on pages that need it.    */

const CACHE_VERSION = "v3"; // bump this to bust old caches

self.addEventListener("install", e => {
  e.waitUntil(caches.delete(CACHE_VERSION));
  self.skipWaiting();
});
self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_VERSION).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

async function handleFetch(request) {
  if (request.cache === "only-if-cached" && request.mode !== "same-origin") {
    return new Response();
  }
  const r = await fetch(request);
  if (r.status === 0) return r;
  const newHeaders = new Headers(r.headers);
  newHeaders.set("Cross-Origin-Opener-Policy", "same-origin");
  newHeaders.set("Cross-Origin-Embedder-Policy", "require-corp");
  newHeaders.set("Cross-Origin-Resource-Policy", "cross-origin");
  return new Response(r.body, {
    status: r.status,
    statusText: r.statusText,
    headers: newHeaders,
  });
}

self.addEventListener("fetch", e => e.respondWith(handleFetch(e.request)));
