// Service Worker for +AI PWA - Enhanced v2
const CACHE_NAME = 'plusai-v2';
const OFFLINE_URL = '/';

// Critical assets to precache
const PRECACHE_ASSETS = [
  '/',
  '/dashboard',
  '/profile',
  '/vault',
  '/favicon.png',
  '/icon-192.png',
  '/icon-512.png',
  '/manifest.json',
];

// Install event - cache critical assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker v2');
  
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Store install timestamp
      const timestamp = new Date().toISOString();
      cache.put(new Request('/__sw_timestamp'), new Response(timestamp));
      
      return cache.addAll(PRECACHE_ASSETS);
    })
  );
  
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker v2');
  
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Store activation timestamp in localStorage (via client message)
      self.clients.matchAll().then((clients) => {
        clients.forEach((client) => {
          client.postMessage({
            type: 'SW_ACTIVATED',
            timestamp: new Date().toISOString(),
            cacheVersion: CACHE_NAME,
          });
        });
      }),
    ])
  );
  
  self.clients.claim();
});

// Fetch event - enhanced caching strategies
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;
  
  // API routes: network-only (no caching)
  if (url.pathname.startsWith('/api/')) {
    return;
  }
  
  // App shell routes: stale-while-revalidate
  const isAppShell = ['/', '/dashboard', '/profile', '/vault'].includes(url.pathname);
  
  if (isAppShell) {
    event.respondWith(staleWhileRevalidate(event.request));
    return;
  }
  
  // Static assets: cache-first
  const isStaticAsset = /\.(js|css|png|jpg|jpeg|svg|gif|webp|woff2|woff|ttf)$/i.test(url.pathname);
  
  if (isStaticAsset) {
    event.respondWith(cacheFirst(event.request));
    return;
  }
  
  // Everything else: network-first with cache fallback
  event.respondWith(networkFirst(event.request));
});

// Stale-while-revalidate strategy
async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAME);
  const cachedResponse = await cache.match(request);
  
  const fetchPromise = fetch(request).then((networkResponse) => {
    if (networkResponse && networkResponse.status === 200) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  }).catch(() => null);
  
  // Return cached response immediately if available, otherwise wait for network
  return cachedResponse || fetchPromise || caches.match(OFFLINE_URL);
}

// Cache-first strategy (for static assets)
async function cacheFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    if (networkResponse && networkResponse.status === 200) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      return caches.match(OFFLINE_URL);
    }
    throw error;
  }
}

// Network-first strategy (with timeout and cache fallback)
async function networkFirst(request, timeout = 5000) {
  try {
    const networkPromise = fetch(request);
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('timeout')), timeout)
    );
    
    const networkResponse = await Promise.race([networkPromise, timeoutPromise]);
    
    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    // Network failed or timed out, try cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // For navigation requests, return offline page
    if (request.mode === 'navigate') {
      return caches.match(OFFLINE_URL);
    }
    
    throw error;
  }
}

// Listen for messages from clients
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Push notification event
self.addEventListener('push', (event) => {
  if (!event.data) return;
  
  try {
    const data = event.data.json();
    
    event.waitUntil(
      self.registration.showNotification(data.title || '+AI', {
        body: data.body || data.message || 'New notification',
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        data: {
          url: data.url || '/',
          notificationId: data.notificationId,
        },
        tag: data.tag || 'default',
        requireInteraction: data.requireInteraction || false,
      })
    );
  } catch (error) {
    console.error('[SW] Push event error:', error);
  }
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  const url = event.notification.data?.url || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Check if there's already a window open
      for (const client of clientList) {
        if (client.url === url && 'focus' in client) {
          return client.focus();
        }
      }
      // Open new window if none found
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});

