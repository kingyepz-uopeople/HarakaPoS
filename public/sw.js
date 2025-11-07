/**
 * Service Worker for Offline Map Tile Caching
 * Caches OpenStreetMap tiles for offline access
 */

const CACHE_NAME = 'haraka-pos-map-cache-v1';
const MAP_TILE_CACHE = 'haraka-pos-map-tiles-v1';

// Common Nairobi area tiles to pre-cache (zoom levels 11-15)
const NAIROBI_BOUNDS = {
  minLat: -1.45,
  maxLat: -1.15,
  minLon: 36.6,
  maxLon: 37.1,
};

// Install event - cache core assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([
        '/',
        '/offline.html', // Fallback page
      ]);
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME && name !== MAP_TILE_CACHE)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Fetch event - cache map tiles
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Handle OpenStreetMap tile requests
  if (url.hostname.includes('tile.openstreetmap.org')) {
    event.respondWith(
      caches.open(MAP_TILE_CACHE).then((cache) => {
        return cache.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            // Return cached tile
            return cachedResponse;
          }

          // Fetch from network and cache
          return fetch(event.request)
            .then((response) => {
              // Only cache successful responses
              if (response && response.status === 200) {
                cache.put(event.request, response.clone());
              }
              return response;
            })
            .catch(() => {
              // If offline and not cached, return a placeholder
              return new Response('Tile unavailable offline', {
                status: 503,
                statusText: 'Service Unavailable',
              });
            });
        });
      })
    );
    return;
  }

  // Handle other requests with network-first strategy
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cache successful GET requests
        if (
          event.request.method === 'GET' &&
          response &&
          response.status === 200
        ) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // Try to serve from cache
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // Return offline page for navigation requests
          if (event.request.mode === 'navigate') {
            return caches.match('/offline.html');
          }
          return new Response('Offline', {
            status: 503,
            statusText: 'Service Unavailable',
          });
        });
      })
  );
});

// Message handler for manual cache operations
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CLEAR_MAP_CACHE') {
    event.waitUntil(
      caches.delete(MAP_TILE_CACHE).then(() => {
        event.ports[0].postMessage({ success: true });
      })
    );
  }

  if (event.data && event.data.type === 'CACHE_SIZE') {
    event.waitUntil(
      caches.open(MAP_TILE_CACHE).then((cache) => {
        return cache.keys().then((keys) => {
          event.ports[0].postMessage({ count: keys.length });
        });
      })
    );
  }
});
