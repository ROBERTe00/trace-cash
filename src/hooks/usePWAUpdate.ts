/**
 * Custom hook for managing PWA updates
 * Can be used to trigger manual updates or check update status
 */

import { useEffect, useState } from "react";
import { forceServiceWorkerUpdate, isIOS, isStandalone } from "@/lib/pwaUtils";

interface PWAUpdateState {
  updateAvailable: boolean;
  isUpdating: boolean;
  registration: ServiceWorkerRegistration | null;
}

export const usePWAUpdate = () => {
  const [state, setState] = useState<PWAUpdateState>({
    updateAvailable: false,
    isUpdating: false,
    registration: null,
  });

  useEffect(() => {
    if (!('serviceWorker' in navigator)) {
      return;
    }

    const checkForUpdates = async () => {
      try {
        const registration = await navigator.serviceWorker.ready;
        await registration.update();
        console.log('[usePWAUpdate] Update check completed');
      } catch (error) {
        console.error('[usePWAUpdate] Update check failed:', error);
      }
    };

    // Initial check
    checkForUpdates();

    // Set up periodic checks
    const intervalId = setInterval(() => {
      if (document.visibilityState === 'visible') {
        checkForUpdates();
      }
    }, 60000); // Check every minute

    return () => clearInterval(intervalId);
  }, []);

  const checkForUpdate = async () => {
    await forceServiceWorkerUpdate();
  };

  const applyUpdate = async () => {
    if (!state.registration) {
      console.warn('[usePWAUpdate] No registration available');
      return;
    }

    setState(prev => ({ ...prev, isUpdating: true }));

    try {
      const waiting = state.registration.waiting;
      
      if (waiting) {
        waiting.postMessage({ type: 'SKIP_WAITING' });
        
        // Wait for controller change
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          window.location.reload();
        });
      } else {
        window.location.reload();
      }
    } catch (error) {
      console.error('[usePWAUpdate] Error applying update:', error);
      setState(prev => ({ ...prev, isUpdating: false }));
    }
  };

  return {
    updateAvailable: state.updateAvailable,
    isUpdating: state.isUpdating,
    checkForUpdate,
    applyUpdate,
    isIOSDevice: isIOS(),
    isStandaloneMode: isStandalone(),
  };
};
