/* BPMF CicloAventuras — Service Worker
   Estratégia: network-first para tudo (pega sempre a versão mais nova quando há sinal),
   com fallback pro cache quando offline. O botão "Baixar Aventura" (em index.html)
   é quem faz o cache pesado (GPX, libs de mapa) sob demanda — este worker só garante
   que o app shell (HTML/JSON) funcione offline mesmo sem o usuário ter clicado em baixar. */

const CACHE_NAME = 'bpmf-ca-v2';
const APP_SHELL = ['index.html', 'manifest.json', 'turmas.json', 'logo-bpmf-oficial.png', 'icon-192.png', 'icon-512.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).catch(()=>{})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy)).catch(()=>{});
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
