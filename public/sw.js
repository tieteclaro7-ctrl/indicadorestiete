/**
 * Service Worker — DASHBOARD DE VENDAS (Claro Tietê Plaza)
 * Estratégia de Cache Segura e Atualização Instantânea:
 * 1. APIs e sincronização (/api/*, Netlify Functions, streaming): NUNCA armazenados em cache (Network-Only).
 * 2. Navegação (HTML): Network-First para garantir que novas publicações na Netlify cheguem imediatamente.
 * 3. Recursos estáticos (JS, CSS, Imagens): Stale-While-Revalidate com limpeza de versões antigas.
 */

const CACHE_VERSION = 'v1.0.2';
const CACHE_NAME = `claro-vendas-${CACHE_VERSION}`;

// Arquivos fundamentais da casca do app (App Shell)
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/favicon.png',
  '/manifest.webmanifest',
  '/pwa-192x192.png',
  '/pwa-512x512.png',
  '/pwa-maskable-512x512.png',
  '/apple-touch-icon.png'
];

// Instalação do Service Worker
self.addEventListener('install', (event) => {
  // Ativação imediata sem esperar o término de sessões antigas
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('[PWA] Aviso no pré-cache inicial:', err);
      });
    })
  );
});

// Ativação: Limpa caches desatualizados e assume controle das abas abertas
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name.startsWith('claro-vendas-') && name !== CACHE_NAME)
          .map((name) => {
            console.log('[PWA] Removendo cache obsoleto:', name);
            return caches.delete(name);
          })
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// Interceptação de requisições de rede
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 1. REGRAS CRÍTICAS DE SINCRONIZAÇÃO E DADOS:
  // NUNCA interceptar ou armazenar em cache requisições de API, Netlify Functions, dados de vendas ou áudio streaming
  if (
    request.method !== 'GET' ||
    url.pathname.startsWith('/api/') ||
    url.pathname.includes('/.netlify/functions/') ||
    url.hostname.includes('firebase') ||
    url.hostname.includes('googleapis.com') ||
    url.pathname.endsWith('.mp3') ||
    url.pathname.endsWith('.wav') ||
    url.hostname.includes('soundhelix') ||
    url.hostname.includes('stream') ||
    url.hostname.includes('mix')
  ) {
    // Busca direta na rede sem passar pelo cache
    return;
  }

  // 2. NAVEGAÇÃO (Páginas HTML): Estratégia Network-First
  // Garante que quando uma nova versão for publicada na Netlify, o usuário receba a versão mais recente
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return networkResponse;
        })
        .catch(async () => {
          // Fallback offline para a casca do app caso não haja sinal de internet
          const cachedResponse = await caches.match(request);
          if (cachedResponse) return cachedResponse;
          const fallback = await caches.match('/index.html');
          return fallback || new Response('Offline - Conecte-se à internet', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
        })
    );
    return;
  }

  // 3. RECURSOS ESTÁTICOS LOCAIS (JS, CSS, Imagens, Fontes): Estratégia Stale-While-Revalidate
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        const fetchPromise = fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const responseClone = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(request, responseClone);
              });
            }
            return networkResponse;
          })
          .catch(() => null);

        // Retorna o cache imediatamente se existir, enquanto revalida em segundo plano
        return cachedResponse || fetchPromise;
      })
    );
  }
});

// Mensagem para forçar ativação imediata sob demanda
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
