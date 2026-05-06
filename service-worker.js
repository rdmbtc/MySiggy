const CACHE_NAME = 'mysiggy-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/game.js',
  '/web3.js',
  '/models/model.gltf',
  '/textures/e8ac44da4f2641a190a3b03367783ead_RGB_gltf_embedded_1.png',
  '/animations/Happy Idle.fbx',
  '/animations/Drinking.fbx',
  '/animations/Dancing.fbx',
  '/animations/Laying Sleeping.fbx',
  '/sounds/background_music.mp3'
];

// Install event - cache assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
  self.skipWaiting();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache hit - return response
        if (response) {
          return response;
        }
        return fetch(event.request);
      }
    )
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Push notification event
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'MySiggy';
  const options = {
    body: data.body || 'Your pet needs attention!',
    icon: '/192x192.png',
    badge: '/192x192.png',
    vibrate: [200, 100, 200],
    data: {
      url: data.url || '/'
    },
    actions: [
      {
        action: 'open',
        title: 'Open Game'
      },
      {
        action: 'close',
        title: 'Later'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'open' || !event.action) {
    event.waitUntil(
      clients.openWindow(event.notification.data.url)
    );
  }
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-pet-stats') {
    event.waitUntil(syncPetStats());
  }
});

async function syncPetStats() {
  // Sync pet stats when back online
  console.log('Syncing pet stats...');
  // This will be handled by the main app
}
