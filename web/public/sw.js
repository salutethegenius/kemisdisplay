/* KemisDisplay — minimal service worker for installability.
 *
 * Only handle same-origin requests. Cross-origin (media CDN, API on another host)
 * must not go through respondWith(fetch): failures reject the promise and Chrome
 * logs “FetchEvent … promise was rejected”, which can break video/display pages.
 */
self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  try {
    const url = new URL(event.request.url);
    if (url.origin !== self.location.origin) {
      return;
    }
  } catch {
    return;
  }

  event.respondWith(
    fetch(event.request).catch(() => {
      return Response.error();
    }),
  );
});
