const CACHE='sendero-0.1.0-c2';
const FILES=['./','./index.html','./style.css','./app.js','./core.js','./icon.svg','./landscape.svg','./icon-192.png','./icon-512.png','./manifest.webmanifest'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES))));
self.addEventListener('activate',event=>event.waitUntil((async()=>{for(const key of await caches.keys())if(key.startsWith('sendero-')&&key!==CACHE)await caches.delete(key);await self.clients.claim();})()));
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET'||new URL(event.request.url).origin!==self.location.origin)return;
  event.respondWith((async()=>{const cached=await caches.match(event.request);if(cached)return cached;try{return await fetch(event.request);}catch{if(event.request.mode==='navigate')return caches.match('./index.html');return Response.error();}})());
});

