const VERSION = "0.4.0";
const CACHE = `sendero-${VERSION}-regatta-final`;
const FILES = [
  "./",
  "./index.html", "./docentes.html",
  "./style.css",
  "./app.js",
  "./profiles.js",
  "./backup.js", "./race.js",
  "./classroom.js",
  "./core.js",
  "./fluency.js",
  "./results.js",
  "./bank.js",
  "./bank-extra.js",
  "./narration.js",
  "./practice.js",
  "./bank-data.js",
  "./icon.svg",
  "./landscape.svg",
  "./icon-192.png",
  "./icon-512.png",
  "./manifest.webmanifest",
  "./actualizar.html",
  "./update.js",
];
self.addEventListener("install", (event) =>
  event.waitUntil(
    caches.open(CACHE).then((c) =>
      // A new app cache must not inherit older files from the browser HTTP cache.
      c.addAll(FILES.map((file) => new Request(file, { cache: "reload" }))),
    ).then(() => self.skipWaiting()),
  ),
);
self.addEventListener('message', (event) => {
  if (event.data?.type === 'GET_VERSION')
    event.source?.postMessage({type:'SENDER_VERSION', version:VERSION});
});
self.addEventListener("activate", (event) =>
  event.waitUntil(
    (async () => {
      for (const key of await caches.keys())
        if (key.startsWith("sendero-") && key !== CACHE)
          await caches.delete(key);
      await self.clients.claim();
    })(),
  ),
);
self.addEventListener("fetch", (event) => {
  if (
    event.request.method !== "GET" ||
    new URL(event.request.url).origin !== self.location.origin
  )
    return;
  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE);
      const cached = await cache.match(event.request);
      if (cached) return cached;
      try {
        return await fetch(event.request);
      } catch {
        if (event.request.mode === "navigate")
          return (await cache.match("./index.html")) || Response.error();
        return Response.error();
      }
    })(),
  );
});
