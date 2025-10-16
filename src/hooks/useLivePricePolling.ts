import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * Hook for automatic polling of live investment prices
 * Triggers price updates every 5 minutes for investments with live_tracking enabled
 */
export function useLivePricePolling(enabled = true) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!enabled) return;

    const updatePrices = async () => {
      try {
        console.log('[LivePrice] Triggering price update...');
        
        const { data, error } = await supabase.functions.invoke('update-live-prices');

        if (error) {
          console.error('[LivePrice] Update error:', error);
          return;
        }

        if (data?.updated > 0) {
          console.log(`[LivePrice] Updated ${data.updated} prices`);
          // Refresh investments query to show new prices
          queryClient.invalidateQueries({ queryKey: ['investments'] });
        }
      } catch (err) {
        console.error('[LivePrice] Polling error:', err);
      }
    };

    // Update immediately on mount
    updatePrices();

    // Then every 5 minutes
    const intervalId = setInterval(updatePrices, 5 * 60 * 1000);

    return () => clearInterval(intervalId);
  }, [enabled, queryClient]);

  return null;
}

/**
 * Hook for manual price refresh
 */
export function useManualPriceRefresh() {
  const queryClient = useQueryClient();

  const refreshPrices = async () => {
    const toastId = toast.loading('Aggiornamento prezzi in corso...');
    
    try {
      const { data, error } = await supabase.functions.invoke('update-live-prices');

      if (error) throw error;

      toast.success('Prezzi aggiornati!', {
        id: toastId,
        description: `${data.updated} investimenti aggiornati`
      });

      queryClient.invalidateQueries({ queryKey: ['investments'] });
    } catch (error) {
      toast.error('Errore nell\'aggiornamento', { id: toastId });
      console.error('Manual refresh error:', error);
    }
  };

  return { refreshPrices };
}
