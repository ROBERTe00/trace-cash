/**
 * PWA utility functions for service worker registration,
 * install prompts, and push notifications
 */

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

let deferredPrompt: BeforeInstallPromptEvent | null = null;
let isUpdateInProgress = false;

export const setUpdateInProgress = (value: boolean) => {
  isUpdateInProgress = value;
};

export const getUpdateInProgress = () => isUpdateInProgress;

/**
 * Register service worker with automatic update checking
 */
export const registerServiceWorker = async (): Promise<ServiceWorkerRegistration | null> => {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        updateViaCache: 'none' // Always check for updates, don't use HTTP cache
      });
      
      console.log('[PWA] Service Worker registered successfully:', registration);
      
      // Check for updates on page load
      registration.update();
      
      // Check for updates when page becomes visible
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          console.log('[PWA] Page visible, checking for updates');
          registration.update();
        }
      });
      
      // Check for updates periodically (every 60 seconds - less aggressive)
      setInterval(() => {
        if (document.visibilityState === 'visible') {
          console.log('[PWA] Periodic update check (1min interval)');
          registration.update();
        }
      }, 60000);
      
      // Listen for new service worker
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        console.log('[PWA] Update found, new worker installing');
        
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            console.log('[PWA] New worker state:', newWorker.state);
            
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('[PWA] New version available');
              
              // On iOS in standalone mode, we need user action
              if (isIOS() && isAppInstalled()) {
                console.log('[PWA] iOS standalone - user update required');
              } else {
                // On Android/Desktop, update can be automatic
                console.log('[PWA] Non-iOS or browser - can auto-update');
              }
            }
          });
        }
      });
      
      return registration;
    } catch (error) {
      console.error('[PWA] Service Worker registration failed:', error);
      return null;
    }
  }
  return null;
};

/**
 * Capture install prompt event
 */
export const captureInstallPrompt = () => {
  window.addEventListener('beforeinstallprompt', (e: Event) => {
    e.preventDefault();
    deferredPrompt = e as BeforeInstallPromptEvent;
    console.log('[PWA] Install prompt captured');
  });
};

/**
 * Show install prompt to user
 */
export const showInstallPrompt = async (): Promise<boolean> => {
  console.log('[PWA] Attempting to show install prompt, deferredPrompt:', !!deferredPrompt);
  
  if (!deferredPrompt) {
    console.log('[PWA] Install prompt not available - event not captured');
    return false;
  }

  try {
    console.log('[PWA] Calling prompt()...');
    await deferredPrompt.prompt();
    
    console.log('[PWA] Waiting for user choice...');
    const { outcome } = await deferredPrompt.userChoice;
    
    console.log(`[PWA] User ${outcome} the install prompt`);
    deferredPrompt = null;
    return outcome === 'accepted';
  } catch (error) {
    console.error('[PWA] Error showing install prompt:', error);
    return false;
  }
};

/**
 * Check if install prompt is available
 */
export const isInstallPromptAvailable = (): boolean => {
  return deferredPrompt !== null;
};

/**
 * Detect iOS device
 */
export const isIOS = (): boolean => {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
};

/**
 * Check if running in Safari
 */
export const isSafari = (): boolean => {
  return /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
};

/**
 * Check if app is installed
 */
export const isAppInstalled = (): boolean => {
  return window.matchMedia('(display-mode: standalone)').matches ||
         (window.navigator as any).standalone === true;
};

/**
 * Request push notification permission
 */
export const requestNotificationPermission = async (): Promise<NotificationPermission> => {
  if (!('Notification' in window)) {
    console.warn('[PWA] Notifications not supported');
    return 'denied';
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission;
  }

  return Notification.permission;
};

/**
 * Subscribe to push notifications
 */
export const subscribeToPushNotifications = async (
  registration: ServiceWorkerRegistration
): Promise<PushSubscription | null> => {
  try {
    const permission = await requestNotificationPermission();
    
    if (permission !== 'granted') {
      console.log('[PWA] Notification permission denied');
      return null;
    }

    // VAPID public key - should be stored in environment variables
    const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY || '';
    
    if (!vapidPublicKey) {
      console.warn('[PWA] VAPID public key not configured');
      return null;
    }

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey) as BufferSource
    });

    console.log('[PWA] Push subscription created:', subscription);
    return subscription;
  } catch (error) {
    console.error('[PWA] Error subscribing to push notifications:', error);
    return null;
  }
};

/**
 * Convert base64 string to Uint8Array for VAPID key
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Show local notification
 */
export const showNotification = async (
  title: string,
  options?: NotificationOptions
): Promise<void> => {
  const permission = await requestNotificationPermission();
  
  if (permission !== 'granted') {
    console.log('[PWA] Cannot show notification, permission denied');
    return;
  }

  if ('serviceWorker' in navigator) {
    const registration = await navigator.serviceWorker.ready;
    await registration.showNotification(title, {
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      ...options
    });
  }
};

/**
 * Check if device is online
 */
export const isOnline = (): boolean => {
  return navigator.onLine;
};

/**
 * Listen for online/offline events
 */
export const setupConnectivityListeners = (
  onOnline: () => void,
  onOffline: () => void
) => {
  window.addEventListener('online', onOnline);
  window.addEventListener('offline', onOffline);

  return () => {
    window.removeEventListener('online', onOnline);
    window.removeEventListener('offline', onOffline);
  };
};

/**
 * Force service worker update
 */
export const forceServiceWorkerUpdate = async (): Promise<void> => {
  if ('serviceWorker' in navigator) {
    const registration = await navigator.serviceWorker.ready;
    await registration.update();
    console.log('[PWA] Forced service worker update check');
  }
};

/**
 * Check if running in standalone mode (installed PWA)
 */
export const isStandalone = (): boolean => {
  return window.matchMedia('(display-mode: standalone)').matches ||
         (window.navigator as any).standalone === true ||
         document.referrer.includes('android-app://');
};

/**
 * Detect iOS version
 */
export const getIOSVersion = (): number | null => {
  if (!isIOS()) return null;
  
  const match = navigator.userAgent.match(/OS (\d+)_/);
  return match ? parseInt(match[1], 10) : null;
};

/**
 * Clear all caches and unregister service worker
 */
export const clearCacheAndReload = async (): Promise<void> => {
  console.log('[PWA] Clearing all caches and unregistering service worker...');
  
  try {
    // Clear all caches
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(name => caches.delete(name)));
      console.log('[PWA] All caches cleared');
    }
    
    // Unregister all service workers
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map(reg => reg.unregister()));
      console.log('[PWA] All service workers unregistered');
    }
    
    // Hard reload
    window.location.reload();
  } catch (error) {
    console.error('[PWA] Error clearing cache:', error);
    throw error;
  }
};
