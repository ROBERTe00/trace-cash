/**
 * Service Worker & Cache Management Utilities
 * Fixes the "old version overlap" issue by providing cache clearing and SW refresh
 */

export const clearServiceWorkerCache = async (): Promise<boolean> => {
  try {
    if ('serviceWorker' in navigator) {
      // Unregister all service workers
      const registrations = await navigator.serviceWorker.getRegistrations();
      
      for (const registration of registrations) {
        await registration.unregister();
        console.log('[SW] Unregistered service worker:', registration.scope);
      }
    }

    // Clear all caches
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map((cacheName) => {
          console.log('[Cache] Deleting cache:', cacheName);
          return caches.delete(cacheName);
        })
      );
    }

    console.log('[SW] Successfully cleared all service workers and caches');
    return true;
  } catch (error) {
    console.error('[SW] Error clearing service workers and caches:', error);
    return false;
  }
};

export const forceReload = () => {
  // Hard reload to bypass cache
  window.location.reload();
};

export const forceHardReload = async (): Promise<void> => {
  try {
    // Unregister all service workers
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const registration of registrations) {
        await registration.unregister();
        console.log('[SW] Unregistered service worker:', registration.scope);
      }
    }

    // Clear all caches
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map((cacheName) => {
          console.log('[Cache] Deleting cache:', cacheName);
          return caches.delete(cacheName);
        })
      );
    }

    // Force reload with cache bust
    const cacheBustUrl = `${window.location.href}${window.location.href.includes('?') ? '&' : '?'}cache-bust=${Date.now()}`;
    window.location.href = cacheBustUrl;
  } catch (error) {
    console.error('[SW] Error in forceHardReload:', error);
    // Fallback to regular reload
    window.location.reload();
  }
};

export const clearCacheAndReload = async () => {
  console.log('[SW] Starting clearCacheAndReload with forceHardReload...');
  await forceHardReload();
};

/**
 * Check if app is running with a stale service worker
 * Useful for debugging version mismatch issues
 */
export const checkServiceWorkerStatus = async () => {
  if (!('serviceWorker' in navigator)) {
    return { hasServiceWorker: false, isStale: false };
  }

  const registration = await navigator.serviceWorker.getRegistration();
  
  return {
    hasServiceWorker: !!registration,
    isStale: registration?.waiting !== null, // Waiting worker means new version available
    active: !!registration?.active,
    waiting: !!registration?.waiting,
    installing: !!registration?.installing,
  };
};

/**
 * Force update to waiting service worker
 */
export const activateWaitingServiceWorker = async () => {
  const registration = await navigator.serviceWorker.getRegistration();
  
  if (registration?.waiting) {
    console.log('[SW] Activating waiting service worker');
    registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    
    // Listen for the new service worker to take control
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      console.log('[SW] New service worker activated, reloading...');
      forceReload();
    });
  }
};
