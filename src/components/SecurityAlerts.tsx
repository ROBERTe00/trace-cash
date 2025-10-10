import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { X, AlertTriangle, Info, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface SecurityAlert {
  id: string;
  alert_type: string;
  severity: 'info' | 'warning' | 'critical';
  message: string;
  details?: any;
  acknowledged: boolean;
  created_at: string;
}

export function SecurityAlerts() {
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);

  useEffect(() => {
    loadAlerts();

    // Subscribe to new alerts
    const channel = supabase
      .channel('security_alerts')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'security_alerts',
        },
        () => loadAlerts()
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, []);

  const loadAlerts = async () => {
    const { data, error } = await supabase
      .from('security_alerts')
      .select('*')
      .eq('acknowledged', false)
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) {
      console.error('Failed to load security alerts:', error);
      return;
    }

    setAlerts((data || []) as SecurityAlert[]);
  };

  const acknowledgeAlert = async (alertId: string) => {
    const { error } = await supabase
      .from('security_alerts')
      .update({ acknowledged: true })
      .eq('id', alertId);

    if (error) {
      toast.error('Failed to acknowledge alert');
      return;
    }

    setAlerts(alerts.filter(a => a.id !== alertId));
    toast.success('Alert acknowledged');
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertCircle className="h-4 w-4" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  const getSeverityVariant = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'destructive';
      case 'warning':
        return 'default';
      default:
        return 'default';
    }
  };

  if (alerts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2 max-w-md">
      {alerts.map(alert => (
        <Alert key={alert.id} variant={getSeverityVariant(alert.severity)}>
          {getSeverityIcon(alert.severity)}
          <AlertTitle className="flex items-center justify-between">
            <span>{alert.alert_type}</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => acknowledgeAlert(alert.id)}
            >
              <X className="h-4 w-4" />
            </Button>
          </AlertTitle>
          <AlertDescription>{alert.message}</AlertDescription>
        </Alert>
      ))}
    </div>
  );
}
