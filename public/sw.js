const CACHE_VERSION = 'v3.0.1'; // Fix: Response clone error - clone before using
const CACHE_NAME = `trace-cash-${CACHE_VERSION}`;
const RUNTIME_CACHE = `trace-cash-runtime-${CACHE_VERSION}`;

// Essential files to cache for offline functionality
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
];

// Install event - precache essential files and skip waiting
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker version:', CACHE_VERSION);
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(PRECACHE_URLS))
  );
});

// Activate event - clean up old caches and take control immediately
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker version:', CACHE_VERSION);
  event.waitUntil((async () => {
    // Clean up old caches
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => !k.includes(CACHE_VERSION)).map(k => {
      console.log('[SW] Deleting old cache:', k);
      return caches.delete(k);
    }));
    
    // Take control of all clients
    await self.clients.claim();
    console.log('[SW] Activation complete');
  })());
});

// Fetch event with network-first for core files, cache-first for assets
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Bypass Service Worker for external hosts (avoid CORS issues with third-party APIs like Yahoo)
  const sameOrigin = url.origin === self.location.origin;
  const isSupabase = url.hostname.includes('supabase.co');
  if (!sameOrigin && !isSupabase) {
    // Do not intercept, let the browser handle the request directly
    return;
  }

  // NEVER cache index.html or app shell - always fetch fresh from network
  if (url.pathname === '/' || url.pathname === '/index.html' || request.destination === 'document') {
    event.respondWith(
      fetch(request, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' }
      }).catch(() => {
        // Only fallback to cache if network completely fails (offline mode)
        return caches.match('/index.html');
      })
    );
    return;
  }

  // Network-first strategy for JS/CSS/assets
  if (
    request.url.includes('.js') ||
    request.url.includes('.css') ||
    url.pathname.startsWith('/assets/')
  ) {
    event.respondWith(
      (async () => {
        try {
          // Try network first with timeout
          const networkPromise = fetch(request, {
            cache: 'no-cache',
            headers: { 'Cache-Control': 'no-cache' }
          });
          
          const timeoutPromise = new Promise((resolve, reject) => {
            setTimeout(() => {
              caches.match(request).then(cachedResponse => {
                if (cachedResponse) {
                  // Suppress verbose logging - only log errors or critical info
                  // In production, these logs are noise. Network slowness is handled gracefully.
                  resolve(cachedResponse);
                } else {
                  reject(new Error('No cache available'));
                }
              });
            }, 2000);
          });

          const response = await Promise.race([networkPromise, timeoutPromise]);
          
          // If we got a network response, clone it BEFORE using it and cache it
          if (response instanceof Response && response.status === 200 && !response.bodyUsed) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(request, responseClone).catch(err => {
                console.error('[SW] Error caching response:', err);
              });
            }).catch(err => {
              console.error('[SW] Error opening cache:', err);
            });
          }
          
          return response;
        } catch (error) {
          // Fallback to cache if network fails
          const cachedResponse = await caches.match(request);
          if (cachedResponse) {
            return cachedResponse;
          }
          throw error;
        }
      })()
    );
    return;
  }

  // Network-first for API calls (Supabase)
  if (url.hostname.includes('supabase.co')) {
    const isInsertCall = request.method === 'POST' && request.url.includes('/rest/v1/expenses');
    
    if (isInsertCall) {
      console.log('[Service Worker] 🔄 INSERT CALL intercepted:', request.url, request.method);
    }
    
    event.respondWith(
      (async () => {
        try {
          if (isInsertCall) {
            console.log('[Service Worker] 📡 Fetching INSERT request...');
          }
          const response = await fetch(request);
          
          if (isInsertCall) {
            console.log('[Service Worker] ✅ INSERT response:', response.status, response.statusText);
          }
          
          // Don't cache authentication or sensitive data
          if (
            request.url.includes('/auth/') || 
            request.url.includes('/storage/') ||
            request.url.includes('/realtime/')
          ) {
            return response;
          }
          
          // NON CACHARE INSERT/UPDATE/DELETE - CRITICO!
          if (request.method === 'POST' || request.method === 'PUT' || request.method === 'PATCH' || request.method === 'DELETE') {
            if (isInsertCall) {
              console.log('[Service Worker] 🚫 Not caching INSERT request');
            }
            return response;
          }
          
          // Cache successful API responses - clone BEFORE using
          if (response.status === 200 && !response.bodyUsed) {
            const responseClone = response.clone();
            caches.open(RUNTIME_CACHE).then(cache => {
              cache.put(request, responseClone).catch(err => {
                console.error('[SW] Error caching API response:', err);
              });
            }).catch(err => {
              console.error('[SW] Error opening cache:', err);
            });
          }
          
          return response;
        } catch (error) {
          if (isInsertCall) {
            console.error('[Service Worker] ❌ INSERT fetch error:', error);
          }
          // NON usare cache per INSERT/UPDATE/DELETE anche in caso di errore!
          if (request.method === 'POST' || request.method === 'PUT' || request.method === 'PATCH' || request.method === 'DELETE') {
            throw error;
          }
          // Fallback to cache if offline solo per GET
          const cachedResponse = await caches.match(request);
          if (cachedResponse) {
            return cachedResponse;
          }
          throw error;
        }
      })()
    );
    return;
  }

  // Cache-first strategy for static assets (images, fonts)
  if (
    request.url.includes('.png') ||
    request.url.includes('.jpg') ||
    request.url.includes('.jpeg') ||
    request.url.includes('.svg') ||
    request.url.includes('.webp') ||
    request.url.includes('.woff') ||
    request.url.includes('.woff2')
  ) {
    event.respondWith(
      (async () => {
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
          // Return cached version immediately
          return cachedResponse;
        }

        try {
          const response = await fetch(request);
          if (response.status === 200 && !response.bodyUsed) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(request, responseClone).catch(err => {
                console.error('[SW] Error caching static asset:', err);
              });
            }).catch(err => {
              console.error('[SW] Error opening cache:', err);
            });
          }
          return response;
        } catch (error) {
          console.error('[SW] Error fetching static asset:', error);
          throw error;
        }
      })()
    );
    return;
  }

  // Default: network-first
  event.respondWith(
    fetch(request)
      .catch(() => caches.match(request))
  );
});

// Listen for messages from the app
self.addEventListener('message', (event) => {
  console.log('[SW] Received message:', event.data);
  
  if (event.data.type === 'SKIP_WAITING') {
    console.log('[SW] Skipping waiting as requested by client');
    self.skipWaiting();
  }
  
  if (event.data.type === 'CHECK_UPDATE') {
    console.log('[SW] Update check requested by client');
    self.registration.update();
  }
  
  if (event.data.type === 'CLEAR_CACHE') {
    console.log('[SW] Clear cache requested by client');
    event.waitUntil(
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            console.log('[SW] Deleting cache:', cacheName);
            return caches.delete(cacheName);
          })
        );
      })
    );
  }
});

// Push notification event
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received');
  
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    console.error('[SW] Error parsing push data:', e);
    data = { title: 'Trace-Cash', message: event.data ? event.data.text() : 'New notification' };
  }
  
  const options = {
    body: data.message || 'New notification from Trace-Cash',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [200, 100, 200],
    data: {
      url: data.action_url || '/',
      dateOfArrival: Date.now(),
    },
    actions: [
      {
        action: 'open',
        title: 'Open App'
      },
      {
        action: 'close',
        title: 'Close'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Trace-Cash', options)
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.action);
  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(windowClients => {
        // Check if there's already a window open
        for (let client of windowClients) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            return client.focus().then(client => {
              // Navigate to the URL
              if ('navigate' in client) {
                return client.navigate(urlToOpen);
              }
            });
          }
        }
        // If no window is open, open a new one
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// Background sync for offline data
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync triggered:', event.tag);
  
  if (event.tag === 'sync-expenses') {
    event.waitUntil(syncExpenses());
  }
});

async function syncExpenses() {
  console.log('[SW] Syncing expenses...');
  // Sync logic would go here
}
