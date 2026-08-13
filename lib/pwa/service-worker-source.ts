const SERVICE_WORKER_TEMPLATE = `
const VERSION = "__SW_VERSION__";

self.addEventListener("install", () => {
  // Do nothing automatically — wait for the explicit SKIP_WAITING message.
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.map((key) => caches.delete(key)));
      await self.clients.claim();
    })()
  );
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
`

export function buildServiceWorkerSource(version: string): string {
  return SERVICE_WORKER_TEMPLATE.replace("__SW_VERSION__", version)
}
