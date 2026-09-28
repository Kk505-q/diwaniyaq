// Self-destructing service worker.
//
// A previous caching service worker caused "too many redirections" loops on
// some devices (it persists even after clearing normal browsing data). This
// version installs, removes all caches, unregisters itself, and reloads open
// pages so they run without any service worker. It intentionally has NO fetch
// handler, so requests go straight to the network.

self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      try {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      } catch (e) {
        // ignore
      }
      try {
        await self.registration.unregister();
      } catch (e) {
        // ignore
      }
      const clients = await self.clients.matchAll({ type: "window" });
      for (const client of clients) {
        try {
          client.navigate(client.url);
        } catch (e) {
          // ignore
        }
      }
    })()
  );
});
