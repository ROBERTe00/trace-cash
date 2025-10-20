/**
 * Real-Time Data Synchronization Hook
 * Subscribes to Supabase real-time updates for expenses and investments
 */

import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

export function useRealTimeExpenseSync() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel('expenses-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'expenses'
        },
        (payload) => {
          console.log('🔄 [RealTime] Expense changed:', payload.eventType);
          
          // Invalidate queries to refetch data
          queryClient.invalidateQueries({ queryKey: ['expenses'] });
        }
      )
      .subscribe();

    console.log('✅ [RealTime] Subscribed to expenses updates');

    return () => {
      console.log('❌ [RealTime] Unsubscribed from expenses');
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
}

export function useRealTimeInvestmentSync() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel('investments-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'investments'
        },
        (payload) => {
          console.log('🔄 [RealTime] Investment changed:', payload.eventType);
          
          // Invalidate queries to refetch data
          queryClient.invalidateQueries({ queryKey: ['investments'] });
        }
      )
      .subscribe();

    console.log('✅ [RealTime] Subscribed to investments updates');

    return () => {
      console.log('❌ [RealTime] Unsubscribed from investments');
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
}

/**
 * Combined hook for all real-time sync
 */
export function useRealTimeSync() {
  useRealTimeExpenseSync();
  useRealTimeInvestmentSync();
}

