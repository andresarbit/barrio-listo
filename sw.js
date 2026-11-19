// Service worker: deja la app andando sin internet.
// Lo propio va primero a la red y, si no hay, al caché. Lo externo (tipografías,
// mapa) se guarda a medida que se usa.
const VERSION = 'barrio-listo-v1';
const EXTERNO = 'barrio-listo-externo';
const BASE = [
  './',
  './index.html',
  './estilos.css',
  './app.js',
  './datos.js',
  './manifest.webmanifest',
  './iconos/icono-192.png',
  './iconos/icono-512.png'
];
const HOSTS_EXTERNOS = /(fonts\.googleapis\.com|fonts\.gstatic\.com|unpkg\.com|tile\.openstreetmap\.org)$/;

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(BASE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((claves) => Promise.all(claves.filter((k) => k.startsWith('barrio-listo-v1') && k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const pedido = e.request;
  if (pedido.method !== 'GET') return;
  const url = new URL(pedido.url);

  if (url.origin === self.location.origin) {
    e.respondWith(
      fetch(pedido)
        .then((resp) => {
          const copia = resp.clone();
          caches.open(VERSION).then((c) => c.put(pedido, copia));
          return resp;
        })
        .catch(() => caches.match(pedido).then((r) => r || caches.match('./index.html')))
    );
    return;
  }

  if (HOSTS_EXTERNOS.test(url.hostname)) {
    e.respondWith(
      caches.open(EXTERNO).then(async (c) => {
        const guardado = await c.match(pedido);
        const red = fetch(pedido)
          .then((resp) => {
            if (resp.ok || resp.type === 'opaque') c.put(pedido, resp.clone());
            return resp;
          })
          .catch(() => guardado);
        return guardado || red;
      })
    );
  }
});
