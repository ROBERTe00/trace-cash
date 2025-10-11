import { useState, useEffect } from "react";
import { Download, X, Smartphone, Zap, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { showInstallPrompt, isAppInstalled } from "@/lib/pwaUtils";
import { toast } from "sonner";

export const PWAInstallPrompt = () => {
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    if (isAppInstalled()) {
      setIsInstalled(true);
      return;
    }

    const timer = setTimeout(() => {
      const dismissed = localStorage.getItem('pwa-install-dismissed');
      const dismissCount = parseInt(localStorage.getItem('pwa-dismiss-count') || '0');
      
      if (!dismissed || dismissCount < 3) {
        setShowPrompt(true);
      }
    }, 15000);

    return () => clearTimeout(timer);
  }, []);

  const handleInstall = async () => {
    const accepted = await showInstallPrompt();
    
    if (accepted) {
      toast.success("App installed successfully!");
      setShowPrompt(false);
      setIsInstalled(true);
      localStorage.removeItem('pwa-dismiss-count');
    } else {
      toast.info("Installation cancelled");
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    const count = parseInt(localStorage.getItem('pwa-dismiss-count') || '0');
    localStorage.setItem('pwa-dismiss-count', String(count + 1));
    
    if (count + 1 >= 3) {
      localStorage.setItem('pwa-install-dismissed', 'true');
    }
  };

  if (isInstalled || !showPrompt) {
    return null;
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 p-4 sm:bottom-4 sm:right-4 sm:left-auto sm:max-w-md animate-slide-up">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/95 to-primary shadow-2xl backdrop-blur-xl border border-primary-foreground/10">
        {/* Close Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={handleDismiss}
          className="absolute right-2 top-2 h-8 w-8 rounded-full text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10 z-10"
        >
          <X className="h-4 w-4" />
        </Button>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Icon & Title */}
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-primary-foreground/10 flex items-center justify-center">
              <Download className="h-6 w-6 text-primary-foreground" />
            </div>
            <div className="flex-1 pt-1">
              <h3 className="text-xl font-bold text-primary-foreground mb-1">
                Install Trace-Cash
              </h3>
              <p className="text-sm text-primary-foreground/80 leading-relaxed">
                Get instant access and work offline
              </p>
            </div>
          </div>

          {/* Features */}
          <div className="space-y-2.5 pl-16">
            <div className="flex items-center gap-3 text-primary-foreground/90">
              <Smartphone className="h-4 w-4 flex-shrink-0" />
              <span className="text-sm">Access from home screen</span>
            </div>
            <div className="flex items-center gap-3 text-primary-foreground/90">
              <Zap className="h-4 w-4 flex-shrink-0" />
              <span className="text-sm">Works offline</span>
            </div>
            <div className="flex items-center gap-3 text-primary-foreground/90">
              <Bell className="h-4 w-4 flex-shrink-0" />
              <span className="text-sm">Push notifications</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              onClick={handleInstall}
              size="lg"
              className="flex-1 bg-primary-foreground text-primary hover:bg-primary-foreground/90 font-semibold shadow-lg"
            >
              Install Now
            </Button>
            <Button
              onClick={handleDismiss}
              size="lg"
              variant="ghost"
              className="text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10"
            >
              Later
            </Button>
          </div>
        </div>

        {/* Decorative gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent pointer-events-none" />
      </div>
    </div>
  );
};
