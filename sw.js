const CACHE_NAME = 'meu-finance-v2.0.0';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  'https://cdn.jsdelivr.net/npm/chart.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.31/jspdf.plugin.autotable.min.js'
];

// Instalação do Service Worker
self.addEventListener('install', event => {
  console.log('[SW] Instalando Service Worker v2.0.0...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] Cache aberto');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('[SW] Todos os arquivos em cache');
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('[SW] Erro ao fazer cache:', error);
      })
  );
});

// Ativação do Service Worker
self.addEventListener('activate', event => {
  console.log('[SW] Ativando Service Worker...');
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== CACHE_NAME) {
              console.log('[SW] Removendo cache antigo:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('[SW] Service Worker ativado e pronto!');
        return self.clients.claim();
      })
  );
});

// Interceptação de requisições - Cache First para recursos estáticos
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Se encontrar no cache, retorna
        if (response) {
          console.log('[SW] Servindo do cache:', event.request.url);
          return response;
        }

        // Caso contrário, busca na rede
        console.log('[SW] Buscando na rede:', event.request.url);
        return fetch(event.request)
          .then(response => {
            // Verifica se a resposta é válida
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clona a resposta para armazenar no cache
            const responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });

            return response;
          })
          .catch(error => {
            console.error('[SW] Erro ao buscar:', error);
            // Se falhar, tenta retornar o index.html do cache
            return caches.match('/index.html');
          });
      })
  );
});

// Mensagens do Service Worker
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        );
      })
    );
  }
});

// Notificação de atualização disponível
self.addEventListener('controllerchange', () => {
  console.log('[SW] Nova versão do Service Worker ativada');
});