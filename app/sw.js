// Polaris service worker: the app opens with no signal. Pages, the app manifest and the icons are network-first
// (fresh on every deploy, so a new logo or name reaches phones that already have the app), everything else (scripts, model files, fonts, the Supabase and three.js libraries) is cache-first.
// Supabase API calls are never cached.
const CACHE = "polaris-v6"; // bump clears every phone's old cache (v5: icons and manifest fresh after the Polaris logo)
self.addEventListener("install", (e) => { self.skipWaiting(); e.waitUntil(caches.open(CACHE).then((c) => c.addAll(["./", "supabase-shim.js", "manifest.webmanifest", "icon-180.png"]))); });
self.addEventListener("activate", (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", (e) => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== "GET" || url.hostname.endsWith("supabase.co") || url.pathname.endsWith("version.json")) return;
  const page = req.mode === "navigate";
  const shim = url.origin === location.origin && url.pathname.endsWith("supabase-shim.js");
  const brand = url.origin === location.origin && /(manifest\.webmanifest|icon-\d+\.png|favicon\.svg)$/.test(url.pathname);
  if (page || shim || brand) {
    e.respondWith(fetch(req, { cache: "no-cache" }).then((r) => { const c = r.clone(); caches.open(CACHE).then((x) => x.put(page ? "./" : req, c)); return r; })
      .catch(() => caches.match(page ? "./" : req)));
    return;
  }
  e.respondWith(caches.match(req).then((hit) => hit || fetch(req).then((r) => {
    if (r.ok || r.type === "opaque") { const c = r.clone(); caches.open(CACHE).then((x) => x.put(req, c)); }
    return r;
  })));
});
// Comeback reminders (migration 20261111070000_comeback): the nudge function sends {id, title, body, url}; a tap opens
// (or focuses) the app at that address, which tells the server it was opened.
self.addEventListener("push", (e) => {
  let d = {}; try { d = e.data ? e.data.json() : {}; } catch (x) {}
  if (!d.title) return;
  e.waitUntil(self.registration.showNotification(d.title, { body: d.body || "", icon: "icon-192.png", badge: "icon-192.png", tag: "polaris-nudge", data: { url: d.url || "./" } }));
});
self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const url = new URL((e.notification.data && e.notification.data.url) || "./", self.registration.scope).href;
  e.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((cs) => {
    const w = cs.find((c) => c.url.startsWith(self.registration.scope));
    return w ? w.navigate(url).then((x) => (x || w).focus()) : self.clients.openWindow(url);
  }));
});
