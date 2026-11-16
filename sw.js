const CACHE='math-keywords-dictionary-v4';
const ASSETS=['./','./index.html','./style.css','./core.js','./app.js','./seed.json','./manifest.webmanifest','./icons/icon.svg','./icons/icon-192.png','./icons/icon-512.png','./icons/maskable-512.png'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(async c=>{await c.addAll(ASSETS.map(url=>new Request(url,{cache:"reload"})));await self.skipWaiting();})));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('math-keywords-dictionary-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{
 if(e.request.method!=='GET'||new URL(e.request.url).origin!==self.location.origin||!new URL(e.request.url).pathname.startsWith(self.registration.scope.replace(self.location.origin,'')))return;
 e.respondWith(caches.open(CACHE).then(async cache=>{
  // Navigations check the deployed page first; cached shell remains available offline.
  if(e.request.mode==='navigate'){
   try{const response=await fetch(e.request,{cache:'no-cache'});if(response.ok)return response;}catch{}
   return await cache.match('./index.html');
  }
  return await cache.match(e.request)||fetch(e.request);
 }));
});
