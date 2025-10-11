import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { RefreshCw, X, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { isIOS, isAppInstalled } from "@/lib/pwaUtils";

export const PWAUpdateNotification = () => {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!('serviceWorker' in navigator)) {
      return;
    }

    const handleUpdate = (reg: ServiceWorkerRegistration) => {
      console.log('[PWA Update] New version detected');
      setRegistration(reg);
      setUpdateAvailable(true);

      // Auto-update on Android/desktop after a short delay
      if (!isIOS() && isAppInstalled()) {
        console.log('[PWA Update] Auto-updating on Android/Desktop');
        setTimeout(() => {
          handleUpdateAction();
        }, 2000);
      } else {
        toast({
          title: "New version available",
          description: isIOS() 
            ? "Tap the button below to update the app"
            : "The app will update automatically",
          duration: 5000,
        });
      }
    };

    // Check for updates
    navigator.serviceWorker.ready.then((reg) => {
      console.log('[PWA Update] Service worker ready, checking for updates...');
      
      // Check immediately
      reg.update();

      // Listen for new service worker
      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing;
        console.log('[PWA Update] Update found, new worker installing');

        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            console.log('[PWA Update] New worker state:', newWorker.state);
            
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New version available
              handleUpdate(reg);
            }
          });
        }
      });

      // Listen for controller change (update activated)
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('[PWA Update] Controller changed, reloading page');
        window.location.reload();
      });
    });

    // Listen for messages from service worker
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data.type === 'SW_ACTIVATED') {
        console.log('[PWA Update] Service worker activated:', event.data.version);
      }
    });

    // Check for updates on page visibility change
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('[PWA Update] App became visible, checking for updates');
        navigator.serviceWorker.ready.then(reg => reg.update());
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Check for updates every 30 seconds when app is active
    const updateInterval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        navigator.serviceWorker.ready.then(reg => reg.update());
      }
    }, 30000);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(updateInterval);
    };
  }, [toast]);

  const handleUpdateAction = async () => {
    if (!registration) {
      console.log('[PWA Update] No registration available');
      return;
    }

    setIsUpdating(true);
    console.log('[PWA Update] Applying update...');

    try {
      const waiting = registration.waiting;
      
      if (waiting) {
        // Tell the service worker to skip waiting
        waiting.postMessage({ type: 'SKIP_WAITING' });
        
        toast({
          title: "Updating...",
          description: "The app is updating to the latest version",
          duration: 2000,
        });

        // Wait a moment then reload
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        console.log('[PWA Update] No waiting worker, reloading directly');
        window.location.reload();
      }
    } catch (error) {
      console.error('[PWA Update] Error during update:', error);
      setIsUpdating(false);
      
      toast({
        title: "Update failed",
        description: "Please refresh the page manually",
        variant: "destructive",
      });
    }
  };

  const handleDismiss = () => {
    setUpdateAvailable(false);
    
    // On iOS, suggest adding to home screen for better updates
    if (isIOS() && !isAppInstalled()) {
      toast({
        title: "Tip for iOS users",
        description: "Add this app to your home screen for automatic updates",
        duration: 5000,
      });
    }
  };

  if (!updateAvailable) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 flex justify-center animate-in slide-in-from-bottom-4 md:left-auto md:right-4 md:w-96">
      <Card className="w-full p-4 shadow-lg border-primary/20 bg-card/95 backdrop-blur-md">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Download className="h-5 w-5 text-primary" />
          </div>
          
          <div className="flex-1 space-y-2">
            <div>
              <h3 className="font-semibold text-sm">
                {isIOS() ? "New version available" : "Updating app..."}
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                {isIOS() 
                  ? "Tap update to get the latest features and improvements"
                  : "The app will update automatically in a moment"}
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleUpdateAction}
                disabled={isUpdating}
                className="flex-1"
              >
                {isUpdating ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                    Update Now
                  </>
                )}
              </Button>
              
              {isIOS() && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleDismiss}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};
