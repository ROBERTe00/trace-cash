import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { WifiOff, Wifi } from 'lucide-react';
import { toast } from 'sonner';

export function OfflineModeToggle() {
  const [offlineMode, setOfflineMode] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success('Connection restored', {
        description: 'You are back online',
      });
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast.warning('Connection lost', {
        description: 'Working in offline mode',
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const toggleOfflineMode = (enabled: boolean) => {
    setOfflineMode(enabled);
    
    if (enabled) {
      toast.info('Private Mode Enabled', {
        description: 'Data will be processed locally and not synced',
      });
    } else {
      toast.info('Private Mode Disabled', {
        description: 'Data synchronization resumed',
      });
    }

    // Store preference
    localStorage.setItem('offline_mode', enabled.toString());
  };

  useEffect(() => {
    const stored = localStorage.getItem('offline_mode');
    if (stored === 'true') {
      setOfflineMode(true);
    }
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {isOnline ? (
            <Wifi className="h-5 w-5 text-green-500" />
          ) : (
            <WifiOff className="h-5 w-5 text-orange-500" />
          )}
          Private Mode
        </CardTitle>
        <CardDescription>
          Process data locally without cloud synchronization
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="offline-mode" className="flex flex-col space-y-1">
            <span>Enable Private Mode</span>
            <span className="text-xs font-normal text-muted-foreground">
              {offlineMode 
                ? 'Data will stay on your device' 
                : 'Data will sync to cloud'}
            </span>
          </Label>
          <Switch
            id="offline-mode"
            checked={offlineMode}
            onCheckedChange={toggleOfflineMode}
          />
        </div>

        <div className="text-sm text-muted-foreground">
          {!isOnline && (
            <p className="text-orange-500">
              ⚠️ You are currently offline. Data will sync when connection is restored.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
