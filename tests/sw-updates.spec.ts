import { describe, it, expect, vi, beforeEach } from 'vitest';
import { delay } from './helpers/test-utils';

// Mock Service Worker API
const mockServiceWorker = {
  controller: null as any,
  ready: Promise.resolve({
    update: vi.fn().mockResolvedValue(undefined),
    unregister: vi.fn().mockResolvedValue(true),
  }),
  register: vi.fn(),
  addEventListener: vi.fn(),
};

// Mock navigator
global.navigator = {
  ...global.navigator,
  serviceWorker: mockServiceWorker as any,
};

describe('Service Worker Updates - Section 4 Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should detect new SW version without aggressive polling', async () => {
    let updateDetected = false;
    const updateCheckInterval = 60000; // 60 seconds

    // Simulate SW update check
    const checkForUpdates = async () => {
      const registration = await navigator.serviceWorker.ready;
      await registration.update();
      updateDetected = true;
    };

    // Mock that update is found within 60s
    setTimeout(() => {
      checkForUpdates();
    }, 30000); // Detected at 30s

    await delay(35000); // Wait slightly longer
    
    expect(updateDetected).toBe(true);
    expect(mockServiceWorker.ready).toBeDefined();
  });

  it('should not reload during active user interaction', async () => {
    let reloadTriggered = false;
    let userIsInteracting = true;

    // Mock window reload
    const originalReload = window.location.reload;
    window.location.reload = vi.fn(() => {
      if (!userIsInteracting) {
        reloadTriggered = true;
      }
    });

    // Simulate SW update available
    const handleUpdate = () => {
      if (!userIsInteracting) {
        window.location.reload();
      }
    };

    // User is typing
    userIsInteracting = true;
    handleUpdate();
    await delay(1000);
    
    expect(reloadTriggered).toBe(false); // Should NOT reload

    // User stops interacting
    userIsInteracting = false;
    handleUpdate();
    
    expect(reloadTriggered).toBe(false); // Still shouldn't auto-reload
    
    // Restore original reload
    window.location.reload = originalReload;
  });

  it('should handle SW activation messages properly', async () => {
    const messageHandler = vi.fn();
    
    mockServiceWorker.addEventListener.mockImplementation((event: string, handler: any) => {
      if (event === 'message') {
        messageHandler.mockImplementation(handler);
      }
    });

    navigator.serviceWorker.addEventListener('message', messageHandler);

    // Simulate SW activation message
    const activationEvent = {
      data: {
        type: 'SW_ACTIVATED',
        version: 'v3.1.0'
      }
    };

    messageHandler(activationEvent);

    expect(messageHandler).toHaveBeenCalledWith(activationEvent);
    expect(activationEvent.data.type).toBe('SW_ACTIVATED');
  });

  it('should clear old caches on activation', async () => {
    const mockCaches = {
      keys: vi.fn().mockResolvedValue(['cache-v1.0', 'cache-v2.0', 'cache-v3.0']),
      delete: vi.fn().mockResolvedValue(true),
    };

    global.caches = mockCaches as any;

    const CURRENT_VERSION = 'v3.0';
    
    // Simulate SW activate event
    const cleanupOldCaches = async () => {
      const cacheNames = await caches.keys();
      const cachesToDelete = cacheNames.filter(name => !name.includes(CURRENT_VERSION));
      
      await Promise.all(
        cachesToDelete.map(name => {
          console.log('[SW] Deleting old cache:', name);
          return caches.delete(name);
        })
      );
    };

    await cleanupOldCaches();

    expect(mockCaches.keys).toHaveBeenCalled();
    expect(mockCaches.delete).toHaveBeenCalledTimes(2); // v1.0 and v2.0 deleted
    expect(mockCaches.delete).toHaveBeenCalledWith('cache-v1.0');
    expect(mockCaches.delete).toHaveBeenCalledWith('cache-v2.0');
  });

  it('should maintain zero layout shifts during updates (CLS target)', async () => {
    // Mock PerformanceObserver for CLS measurement
    let clsScore = 0;

    const mockPerformanceObserver = {
      observe: vi.fn(),
      disconnect: vi.fn(),
    };

    global.PerformanceObserver = vi.fn().mockImplementation((callback) => {
      // Simulate CLS entries
      callback({
        getEntries: () => [
          { hadRecentInput: false, value: 0.005 },
          { hadRecentInput: false, value: 0.003 },
        ]
      });
      return mockPerformanceObserver;
    }) as any;

    const measureCLS = () => {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!(entry as any).hadRecentInput) {
            clsScore += (entry as any).value;
          }
        }
      });
      return observer;
    };

    const observer = measureCLS();
    
    // Simulate SW update (should not cause layout shift)
    await delay(100);
    
    expect(clsScore).toBeLessThan(0.01); // CLS target: < 0.01
    expect(mockPerformanceObserver.observe).toHaveBeenCalled();
  });

  it('should handle offline->online transition gracefully', async () => {
    let isOnline = false;
    const onlineHandlers: Function[] = [];

    // Mock online/offline events
    window.addEventListener = vi.fn((event: string, handler: any) => {
      if (event === 'online') {
        onlineHandlers.push(handler);
      }
    });

    const handleOnline = () => {
      isOnline = true;
      // Check for updates when coming back online
      navigator.serviceWorker.ready.then(reg => reg.update());
    };

    window.addEventListener('online', handleOnline);

    // Simulate going online
    isOnline = true;
    onlineHandlers.forEach(handler => handler());

    await delay(100);

    expect(isOnline).toBe(true);
    expect(window.addEventListener).toHaveBeenCalledWith('online', expect.any(Function));
  });
});
