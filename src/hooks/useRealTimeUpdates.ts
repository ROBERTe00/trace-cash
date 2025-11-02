// Real-time Updates Hook - Live data synchronization
import { useEffect, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { eventBus, Events } from '@/core/event-system';

interface UseRealTimeUpdatesOptions {
  queryKey: string[];
  table?: string;
  enabled?: boolean;
  pollingInterval?: number; // milliseconds, 0 = disabled
  onUpdate?: (data: any) => void;
}

/**
 * Hook for real-time data updates
 * Uses Supabase real-time subscriptions with polling fallback
 */
export function useRealTimeUpdates<T = any>(options: UseRealTimeUpdatesOptions) {
  const {
    queryKey,
    table,
    enabled = true,
    pollingInterval = 30000, // 30 seconds default
    onUpdate
  } = options;

  const queryClient = useQueryClient();
  const channelRef = useRef<any>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  // Supabase real-time subscription
  useEffect(() => {
    if (!enabled || !table) return;

    // Cleanup existing channel
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    try {
      const channel = supabase
        .channel(`${table}-updates-${queryKey.join('-')}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: table
          },
          (payload: any) => {
            console.log(`[useRealTimeUpdates] ${table} changed:`, payload.eventType);
            
            // Force immediate refetch (not just invalidation)
            queryClient.invalidateQueries({ queryKey, refetchType: 'active' });
            queryClient.refetchQueries({ queryKey });
            
            // Emit event
            if (payload.eventType === 'INSERT') {
              eventBus.emit(Events.STATE_CHANGED, { type: 'create', data: payload.new });
            } else if (payload.eventType === 'UPDATE') {
              eventBus.emit(Events.STATE_CHANGED, { type: 'update', data: payload.new });
            } else if (payload.eventType === 'DELETE') {
              eventBus.emit(Events.STATE_CHANGED, { type: 'delete', data: payload.old });
            }

            // Call custom update handler
            if (onUpdate) {
              onUpdate(payload);
            }
          }
        )
        .subscribe((status) => {
          console.log(`[useRealTimeUpdates] ${table} subscription status:`, status);
        });

      channelRef.current = channel;
    } catch (error) {
      console.error(`[useRealTimeUpdates] Error setting up real-time subscription for ${table}:`, error);
    }

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [table, enabled, queryKey, queryClient, onUpdate]);

  // Polling fallback
  useEffect(() => {
    if (!enabled || pollingInterval === 0) return;

    // Clear existing polling
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
    }

    pollingRef.current = setInterval(() => {
      console.log(`[useRealTimeUpdates] Polling for ${queryKey.join('-')}`);
      queryClient.invalidateQueries({ queryKey });
    }, pollingInterval);

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [enabled, pollingInterval, queryKey, queryClient]);

  return {
    isSubscribed: channelRef.current !== null,
    pollingActive: pollingRef.current !== null
  };
}

/**
 * Hook for optimistic updates
 */
export function useOptimisticUpdate<T>() {
  const queryClient = useQueryClient();

  const updateOptimistically = useCallback(
    (queryKey: string[], updater: (old: T[]) => T[]) => {
      // Cancel outgoing refetches
      queryClient.cancelQueries({ queryKey });

      // Snapshot previous value
      const previous = queryClient.getQueryData<T[]>(queryKey) || [];

      // Optimistically update
      queryClient.setQueryData<T[]>(queryKey, updater);

      // Return rollback function
      return () => {
        queryClient.setQueryData(queryKey, previous);
      };
    },
    [queryClient]
  );

  return { updateOptimistically };
}

