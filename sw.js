const CACHE = "rkbeta12";
const EXT = "rkbeta12-ext";
const SHELL = ["./", "./index.html", "./manifest.json"];
const CDN = [
  "https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.js",
  "https://js.stripe.com/v3"
];

self.addEventListener("install", e => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(SHELL).catch(() => {}))
      .then(() => caches.open(EXT).then(c => Promise.all(CDN.map(u => c.add(u).catch(() => {})))))
  );
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== CACHE && k !== EXT).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const r = e.request;
  if(r.method !== "GET") return;
  const host = new URL(r.url).host;

  if(host === location.host){
    e.respondWith(
      fetch(r).then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(r, copy)).catch(() => {});
        return res;
      }).catch(() => caches.match(r).then(m => m || caches.match("./index.html")))
    );
    return;
  }

  if(host === "cdn.jsdelivr.net" || host === "js.stripe.com"){
    e.respondWith(
      caches.match(r).then(hit => hit || fetch(r).then(res => {
        const copy = res.clone();
        caches.open(EXT).then(c => c.put(r, copy)).catch(() => {});
        return res;
      }))
    );
  }
});