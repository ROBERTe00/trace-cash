// Enhanced Recent Transactions Widget - With real-time updates
import { RecentTransactionsWidget } from './RecentTransactionsWidget';
import { useRealTimeUpdates } from '@/hooks/useRealTimeUpdates';
import { useQueryClient } from '@tanstack/react-query';
import { eventBus, Events } from '@/core/event-system';
import { useEffect, useState } from 'react';

export function EnhancedRecentTransactionsWidget() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const queryClient = useQueryClient();

  // Real-time updates for transactions - Force refetch
  useRealTimeUpdates({
    queryKey: ['expenses'],
    table: 'expenses',
    enabled: true,
    pollingInterval: 15000, // Poll every 15 seconds (reduced for faster updates)
    onUpdate: () => {
      console.log('[EnhancedRecentTransactionsWidget] Data updated, refreshing transactions');
      // Force immediate refetch
      queryClient.refetchQueries({ queryKey: ['expenses'] });
      setRefreshTrigger(prev => prev + 1);
    }
  });

  // Listen to transaction events - Force immediate refetch
  useEffect(() => {
    const unsubscribe1 = eventBus.on(Events.TRANSACTION_CREATED, (data) => {
      console.log('[EnhancedRecentTransactionsWidget] Transaction created, forcing immediate refetch');
      // Force immediate refetch
      queryClient.invalidateQueries({ queryKey: ['expenses'], refetchType: 'active' });
      queryClient.refetchQueries({ queryKey: ['expenses'] });
      setRefreshTrigger(prev => prev + 1);
    });

    const unsubscribe2 = eventBus.on(Events.TRANSACTION_UPDATED, () => {
      console.log('[EnhancedRecentTransactionsWidget] Transaction updated, forcing immediate refetch');
      queryClient.invalidateQueries({ queryKey: ['expenses'], refetchType: 'active' });
      queryClient.refetchQueries({ queryKey: ['expenses'] });
      setRefreshTrigger(prev => prev + 1);
    });

    const unsubscribe3 = eventBus.on(Events.TRANSACTION_DELETED, () => {
      console.log('[EnhancedRecentTransactionsWidget] Transaction deleted, forcing immediate refetch');
      queryClient.invalidateQueries({ queryKey: ['expenses'], refetchType: 'active' });
      queryClient.refetchQueries({ queryKey: ['expenses'] });
      setRefreshTrigger(prev => prev + 1);
    });

    return () => {
      unsubscribe1();
      unsubscribe2();
      unsubscribe3();
    };
  }, []);

  // Force re-render when refreshTrigger changes
  return <RecentTransactionsWidget key={refreshTrigger} />;
}

