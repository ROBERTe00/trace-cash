// Enhanced AI Insights Widget - With real-time refresh
import { AIInsightsWidget } from './AIInsightsWidget';
import { useRealTimeUpdates } from '@/hooks/useRealTimeUpdates';
import { eventBus, Events } from '@/core/event-system';
import { useEffect, useState } from 'react';

export function EnhancedAIInsightsWidget() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Real-time updates for insights
  useRealTimeUpdates({
    queryKey: ['insights'],
    table: 'expenses', // Refresh when expenses change
    enabled: true,
    pollingInterval: 60000, // Poll every minute
    onUpdate: () => {
      console.log('[EnhancedAIInsightsWidget] Data updated, refreshing insights');
      setRefreshTrigger(prev => prev + 1);
    }
  });

  // Listen to transaction events
  useEffect(() => {
    const unsubscribe1 = eventBus.on(Events.TRANSACTION_CREATED, () => {
      console.log('[EnhancedAIInsightsWidget] Transaction created, refreshing insights');
      setRefreshTrigger(prev => prev + 1);
    });

    const unsubscribe2 = eventBus.on(Events.TRANSACTION_UPDATED, () => {
      console.log('[EnhancedAIInsightsWidget] Transaction updated, refreshing insights');
      setRefreshTrigger(prev => prev + 1);
    });

    return () => {
      unsubscribe1();
      unsubscribe2();
    };
  }, []);

  // Force re-render when refreshTrigger changes
  return <AIInsightsWidget key={refreshTrigger} />;
}

