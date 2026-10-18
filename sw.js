const V='muraja3a-v3';
self.addEventListener('install',e=>{self.skipWaiting()});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==V).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
  const r=e.request;if(r.method!=='GET')return;
  const u=new URL(r.url);
  const mine=u.origin===location.origin,fonts=u.hostname==='cdn.jsdelivr.net';
  if(!mine&&!fonts)return;                       // audio and everything else: network only
  if(r.mode==='navigate'){                        // the app itself: network first, so updates arrive
    e.respondWith(fetch(r).then(x=>{const c=x.clone();caches.open(V).then(h=>h.put(r,c));return x}).catch(()=>caches.match(r).then(h=>h||caches.match('index.html'))));return;
  }
  e.respondWith(caches.open(V).then(async c=>{                 // fonts and tafsir: cache first
    const hit=await c.match(r);if(hit)return hit;
    const x=await fetch(r);if(x&&x.ok)c.put(r,x.clone());return x;
  }));
});