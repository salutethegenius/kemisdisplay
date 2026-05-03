/* KemisDisplay — minimal service worker for installability (Add to Home Screen / PWA hints).
 *
 * We intentionally do NOT use fetch event handlers. Intercepting same-origin fetches and
 * falling back to Response.error() on failure causes Chrome console noise (“FetchEvent …
 * network error response”) and can destabilize the display player when RSC chunks or
 * manifest requests flake. Install + activate + clients.claim() is enough for many
 * platforms to treat the site as installable alongside manifest + icons.
 */
self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});
