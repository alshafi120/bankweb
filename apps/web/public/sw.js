/* عاملُ خدمةٍ صغير: الصفحةُ من الشبكة أوّلاً لتبقى حيّة، وما سُحب يُخزَّن
   ليُعرض حين تنقطع. وملفّاتُ البناء (خطوطٌ وأيقوناتٌ وجافاسكربت) من
   المخزن أوّلاً — فلا تُحمَّل مرّتين. تجربةٌ محلّيّةٌ لا إنتاج. */
const V = 'withaq-trial-v1';
const SHELL = ['/ar', '/icons/icon-192.png', '/icons/icon-512.png', '/manifest.webmanifest'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(V).then((c) => c.addAll(SHELL).catch(() => {})).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys()
    .then((k) => Promise.all(k.filter((x) => x !== V).map((x) => caches.delete(x))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const r = e.request;
  if (r.method !== 'GET') return;
  const u = new URL(r.url);
  if (u.origin !== self.location.origin) return;

  /* الأصولُ الثابتة: من المخزن أوّلاً */
  if (u.pathname.startsWith('/_next/static') || u.pathname.startsWith('/icons')) {
    e.respondWith(caches.match(r).then((hit) => hit || fetch(r).then((res) => {
      const copy = res.clone();
      caches.open(V).then((c) => c.put(r, copy));
      return res;
    })));
    return;
  }
  /* الصفحاتُ: الشبكةُ أوّلاً ثمّ المخزن عند الانقطاع */
  e.respondWith(fetch(r).then((res) => {
    const copy = res.clone();
    caches.open(V).then((c) => c.put(r, copy));
    return res;
  }).catch(() => caches.match(r).then((hit) => hit || caches.match('/ar'))));
});
