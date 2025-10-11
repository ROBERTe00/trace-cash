import { useState, useEffect } from "react";
import { Download, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { showInstallPrompt, isAppInstalled } from "@/lib/pwaUtils";
import { toast } from "sonner";

export const PWAInstallPrompt = () => {
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if app is already installed
    if (isAppInstalled()) {
      setIsInstalled(true);
      return;
    }

    // Show prompt after 30 seconds if not installed
    const timer = setTimeout(() => {
      const dismissed = localStorage.getItem('pwa-install-dismissed');
      if (!dismissed) {
        setShowPrompt(true);
      }
    }, 30000);

    return () => clearTimeout(timer);
  }, []);

  const handleInstall = async () => {
    const accepted = await showInstallPrompt();
    
    if (accepted) {
      toast.success("App installata con successo!");
      setShowPrompt(false);
      setIsInstalled(true);
    } else {
      toast.info("Installazione annullata");
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa-install-dismissed', 'true');
    toast.info("Puoi installare l'app in seguito dalle impostazioni");
  };

  if (isInstalled || !showPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm animate-slide-in">
      <Card className="glass-card border-primary/20">
        <CardHeader className="relative pb-3">
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-2 h-6 w-6"
            onClick={handleDismiss}
          >
            <X className="h-4 w-4" />
          </Button>
          <CardTitle className="text-lg flex items-center gap-2">
            <Download className="h-5 w-5 text-primary" />
            Installa Trace-Cash
          </CardTitle>
          <CardDescription>
            Installa l'app sul tuo dispositivo per un accesso più rapido e funzionalità offline
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <ul className="text-sm space-y-2 text-muted-foreground">
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              Accesso istantaneo dalla home screen
            </li>
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              Funzionalità offline per visualizzare i dati
            </li>
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              Notifiche per alert finanziari
            </li>
          </ul>
          <div className="flex gap-2">
            <Button onClick={handleInstall} className="flex-1">
              Installa Ora
            </Button>
            <Button onClick={handleDismiss} variant="outline">
              Più Tardi
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
