/* Grounds Tracker service worker — keeps the app shell loadable offline.
   Strategy: network-first for the app page (so updates land when online),
   cache fallback when there's no signal. API calls pass through untouched.

   SOURCE COPY — edit here, then deploy to ~/mysite/static/grounds/sw.js
   (see "To change the app" in Grounds Tracker.md). Bump CACHE's version
   suffix (v2 -> v3 ...) whenever you change this file so old shell caches
   are cleared on activate. */
const CACHE = "grounds-shell-v2";
const SHELL = ["/grounds/", "/grounds/index.html"];

self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k.startsWith("grounds-shell") && k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const u = new URL(e.request.url);
  if (u.origin === location.origin && (u.pathname === "/grounds/" || u.pathname === "/grounds/index.html")) {
    e.respondWith(
      fetch(e.request)
        .then(r => {
          const copy = r.clone();
          caches.open(CACHE).then(c => c.put(e.request, copy));
          return r;
        })
        .catch(() => caches.match(e.request).then(m => m || caches.match("/grounds/")))
    );
  }
});
