/* app shell: network first so updates arrive. Page fonts, tafsir and the search text: cache first in mj-data.
   Recitation: from the reciter's cache when downloaded (with byte ranges for seeking), otherwise from the network. */
const V='mj-app-v4',DATA='mj-data';
self.addEventListener('install',e=>{self.skipWaiting()});
self.addEventListener('activate',e=>{e.waitUntil((async()=>{
  for(const k of await caches.keys()){
    if(k.startsWith('muraja3a-v')){            // the old single cache: keep its fonts and tafsir
      const o=await caches.open(k),d=await caches.open(DATA);
      for(const r of await o.keys()){if(/\.(woff2|json)$/.test(new URL(r.url).pathname)){const x=await o.match(r);if(x)await d.put(r,x)}}
      await caches.delete(k);
    }else if(k.startsWith('mj-app-')&&k!==V)await caches.delete(k);
  }
  await self.clients.claim();
})())});
async function audio(r){
  const hit=await caches.match(r.url);if(!hit)return fetch(r);
  const range=r.headers.get('range');if(!range)return hit;
  const b=await hit.blob(),m=/bytes=(\d*)-(\d*)/.exec(range)||[];
  let s=m[1]?+m[1]:0,end=m[2]?+m[2]:b.size-1;if(!m[1]&&m[2]){s=Math.max(0,b.size-+m[2]);end=b.size-1}
  end=Math.min(end,b.size-1);
  return new Response(b.slice(s,end+1),{status:206,statusText:'Partial Content',headers:{'Content-Type':hit.headers.get('Content-Type')||'audio/mpeg','Content-Range':'bytes '+s+'-'+end+'/'+b.size,'Content-Length':String(end-s+1),'Accept-Ranges':'bytes'}});
}
self.addEventListener('fetch',e=>{
  const r=e.request;if(r.method!=='GET')return;
  const u=new URL(r.url);
  if(/(^|\.)everyayah\.com$|(^|\.)mp3quran\.net$/.test(u.hostname)){e.respondWith(audio(r));return}
  const mine=u.origin===location.origin,fonts=u.hostname==='cdn.jsdelivr.net';
  if(!mine&&!fonts)return;
  if(r.mode==='navigate'){
    e.respondWith(fetch(r).then(x=>{const c=x.clone();caches.open(V).then(h=>h.put(r,c));return x}).catch(()=>caches.match(r,{ignoreSearch:true}).then(h=>h||caches.match('./').then(x=>x||caches.match('index.html')))));return;
  }
  e.respondWith(caches.match(r).then(async hit=>{
    if(hit)return hit;
    const x=await fetch(r);if(x&&x.ok){const c=x.clone();caches.open(DATA).then(d=>d.put(r,c))}return x;
  }));
});