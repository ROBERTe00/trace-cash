import { useState, useEffect } from "react";
import { WifiOff, Wifi } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { isOnline, setupConnectivityListeners } from "@/lib/pwaUtils";

export const PWAOfflineIndicator = () => {
  const [online, setOnline] = useState(isOnline());
  const [showAlert, setShowAlert] = useState(false);

  useEffect(() => {
    const cleanup = setupConnectivityListeners(
      () => {
        setOnline(true);
        setShowAlert(true);
        setTimeout(() => setShowAlert(false), 3000);
      },
      () => {
        setOnline(false);
        setShowAlert(true);
      }
    );

    return cleanup;
  }, []);

  if (!showAlert) {
    return null;
  }

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-slide-down">
      <Alert className={online ? "bg-green-500/10 border-green-500/20" : "bg-destructive/10 border-destructive/20"}>
        <div className="flex items-center gap-2">
          {online ? (
            <Wifi className="h-4 w-4 text-green-500" />
          ) : (
            <WifiOff className="h-4 w-4 text-destructive" />
          )}
          <AlertDescription className={online ? "text-green-600 dark:text-green-400" : "text-destructive"}>
            {online ? "Connessione ripristinata" : "Modalità offline - Alcune funzionalità potrebbero essere limitate"}
          </AlertDescription>
        </div>
      </Alert>
    </div>
  );
};
