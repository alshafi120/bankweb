/* لوحةُ التحكّم: لا تُخزَّن صفحاتُها ألبتّة — شاشةُ إدارةٍ تُعرض من
   مخزنٍ قديمٍ تكذب على صاحبها: طلبٌ عولج يظهر معلّقاً، وقائمةٌ حُذف
   منها تبقى. فلا يُخزَّن إلّا ما لا يتغيّر: الخطوطُ والأيقوناتُ وملفّاتُ
   البناء. والعاملُ هنا لأجل التثبيت لا لأجل العمل بلا شبكة. */
const V = 'withaq-admin-trial-v1';

self.addEventListener('install', (e) => { e.waitUntil(self.skipWaiting()); });
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
  if (!u.pathname.startsWith('/_next/static') && !u.pathname.startsWith('/icons')) return;
  e.respondWith(caches.match(r).then((hit) => hit || fetch(r).then((res) => {
    const copy = res.clone();
    caches.open(V).then((c) => c.put(r, copy));
    return res;
  })));
});
