// Service Worker for Artemis PWA
// Bump this version whenever the app changes to invalidate old caches
const CACHE_NAME = 'artemis-v4';
const BASE_PATH = '/artemis/';

// Install event - skip waiting to activate immediately
self.addEventListener('install', (event) => {
  // Skip waiting to activate the new service worker immediately
  self.skipWaiting();
});

// Activate event - clean up ALL old caches and take control immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Delete ALL old caches (including artemis-v3 and earlier)
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // Take control of all clients immediately
      return self.clients.claim();
    })
  );
});

// Fetch event - NETWORK-FIRST strategy (always try to get fresh content)
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Only handle requests from our app's scope
  if (!url.pathname.startsWith(BASE_PATH)) {
    return;
  }

  // For navigation requests, always try network first
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(BASE_PATH + 'index.html')
        .then((response) => {
          // Cache the fresh response for offline use
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(BASE_PATH + 'index.html', responseToCache);
          });
          return response;
        })
        .catch(() => {
          // Only use cache if network fails (offline)
          return caches.match(BASE_PATH + 'index.html');
        })
    );
    return;
  }

  // For all other requests: network-first with cache fallback
  event.respondWith(
    fetch(request)
      .then((response) => {
        // Cache successful responses for offline use
        if (response && response.status === 200) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        // Only use cache if network fails (offline)
        return caches.match(request);
      })
  );
});
