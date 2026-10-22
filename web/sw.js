const VERSION = "0.18.0";
const CACHE = `sendero-${VERSION}-contracts-c13-v1`;
const FILES = [
  "./teacher-reading-state.js",
  "./cloud-room-ui.js", "./cloud-room-contract.js", "./cloud-room-link.js", "./cloud-room-view.js",
  "./assigned-workshop.js", "./assigned-workshop-view.js", "./workshop-catalog.js", "./workshop-model-v1.js", "./reasoning-c8.js", "./reasoning-c9.js", "./reasoning-support.js", "./buffered-reflection.js", "./teaching-insights.js", "./teaching-insights.css", "./task-preview.js", "./teacher-c9.css",
  "./",
  "./index.html", "./docentes.html",
  "./style.css", "./research-notice.js", "./research-notice.css", "./terminos.html",
  "./regatta.css", "./race-art.js", "./race-audio.js",
  "./race-finish.js",
  "./race-start.js", "./race-start.css",
  "./race-motion.js", "./race-world.css", "./circuit.js", "./circuit.css", "./learning-review.js",
      "./juntos.html", "./together.css", "./together.js", "./room.js", "./room-link.js", "./vendor/peerjs-1.5.5.min.js",
  "./art.js", "./art.css", "./assets/luma-forest-c8.webp", "./assets/workshops-atlas-c8.webp",
  "./assets/forest-river-v1.png", "./assets/river-racers-v1.png",
  "./app.js", "./workshop.js", "./practice-view.js", "./workshop-view.js", "./workshop.css",
  "./profiles.js", "./enrollment.js", "./cohorts.js", "./reconciliation.js", "./reconciliation-view.js", "./multiplayer-records.js", "./together-profiles.js", "./together-local.js",
  "./backup.js", "./race.js",
  "./classroom.js", "./cloud.js", "./cloud-view.js",
  "./core.js", "./assignments.js", "./task-content.js", "./assignment-view.js",
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
