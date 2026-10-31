/* JournalOS — ROOT service worker (migration shim). 
   The app used to live at "/" with its own service worker registered as /sw.js.
   The app now lives at /app/ (with its own worker at /app/sw.js). Browsers that
   already installed the OLD worker will fetch THIS file at the same URL, which
   removes the old worker and its stale caches so the new landing page at "/"
   is always served fresh. New visitors never register this file. */
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter(n => n.startsWith('journalos-')).map(n => caches.delete(n)));
    await self.registration.unregister();
    const clients = await self.clients.matchAll({ type: 'window' });
    clients.forEach(c => { try { c.navigate(c.url); } catch (e) {} });
  })());
});
self.addEventListener('fetch', () => {});
